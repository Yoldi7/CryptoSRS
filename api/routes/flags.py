from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Wallet, db
import os

flags_bp = Blueprint('flags', __name__)

def read_flag_file(filename):
    """Leer flag desde archivo."""
    flag_path = os.path.join('/flags', filename)
    try:
        with open(flag_path, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

@flags_bp.route('/user', methods=['GET'])
@jwt_required()
def get_user_flag():
    """Obtener la flag de usuario (requiere flagcoin)."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Si el usuario es premium, no requiere flagcoin
    if user.account_level == 'premium':
        flag = read_flag_file('user_flag.txt')
        if not flag:
            return jsonify({'error': 'Flag file not found'}), 500
        return jsonify({
            'flag': flag,
            'message': 'Congratulations! You completed level 1'
        }), 200

    # Verificar si tiene flagcoin (buscar tanto en mayúsculas como minúsculas)
    flagcoin_wallet = Wallet.query.filter_by(user_id=user_id, coin='flagcoin').first()
    if not flagcoin_wallet:
        flagcoin_wallet = Wallet.query.filter_by(user_id=user_id, coin='FlagCoin').first()
    if not flagcoin_wallet or flagcoin_wallet.balance <= 0:
        return jsonify({
            'error': 'You need to buy flagcoin to unlock this flag',
            'hint': 'Try exploiting the trading system...'
        }), 403

    # Leer flag desde archivo
    flag = read_flag_file('user_flag.txt')
    if not flag:
        return jsonify({'error': 'Flag file not found'}), 500

    return jsonify({
        'flag': flag,
        'message': 'Congratulations! You completed level 1'
    }), 200

@flags_bp.route('/buy-premium', methods=['POST'])
@jwt_required()
def buy_premium():
    """Comprar plan premium por 1 FlagCoin y obtener la flag."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verificar si tiene al menos 1 FlagCoin (buscar tanto en mayúsculas como minúsculas)
    flagcoin_wallet = Wallet.query.filter_by(user_id=user_id, coin='flagcoin').first()
    if not flagcoin_wallet:
        flagcoin_wallet = Wallet.query.filter_by(user_id=user_id, coin='FlagCoin').first()
    
    if not flagcoin_wallet or flagcoin_wallet.balance < 1.0:
        return jsonify({
            'success': False,
            'message': 'Necesitas al menos 1 FlagCoin para comprar el plan premium',
            'current_balance': flagcoin_wallet.balance if flagcoin_wallet else 0.0
        }), 400
    
    # Restar 1 FlagCoin del balance
    flagcoin_wallet.balance -= 1.0
    
    # Actualizar el nivel de cuenta del usuario a premium
    user.account_level = 'premium'
    
    # Guardar cambios en la base de datos
    db.session.commit()
    
    # Leer flag desde archivo
    flag = read_flag_file('user_flag.txt')
    if not flag:
        return jsonify({'error': 'Flag file not found'}), 500
    
    return jsonify({
        'success': True,
        'flag': flag,
        'message': '¡Felicidades! Ahora eres usuario premium',
        'remaining_balance': flagcoin_wallet.balance
    }), 200

@flags_bp.route('/validate-user', methods=['POST'])
def validate_user_flag():
    """Validar flag de usuario."""
    data = request.get_json()
    submitted_flag = data.get('flag', '').strip()
    
    if not submitted_flag:
        return jsonify({'error': 'No flag provided'}), 400
    
    correct_flag = read_flag_file('user_flag.txt')
    
    if submitted_flag == correct_flag:
        return jsonify({
            'valid': True,
            'message': 'Correct! Level 1 completed'
        }), 200
    else:
        return jsonify({
            'valid': False,
            'message': 'Incorrect flag'
        }), 200

@flags_bp.route('/validate-admin', methods=['POST'])
def validate_admin_flag():
    """Validar flag de admin."""
    data = request.get_json()
    submitted_flag = data.get('flag', '').strip()
    
    if not submitted_flag:
        return jsonify({'error': 'No flag provided'}), 400
    
    correct_flag = read_flag_file('admin_flag.txt')
    
    if submitted_flag == correct_flag:
        return jsonify({
            'valid': True,
            'message': 'Correct! Level 3 completed - You got root!'
        }), 200
    else:
        return jsonify({
            'valid': False,
            'message': 'Incorrect flag'
        }), 200