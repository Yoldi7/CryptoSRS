from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Wallet
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
    
    # Verificar si tiene flagcoin
    flagcoin_wallet = Wallet.query.filter_by(user_id=user_id, coin='flagcoin').first()
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