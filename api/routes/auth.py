from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from models import db, User, Wallet

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    data = request.get_json()
    
    # Validar entrada
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    username = data['username'].strip()
    email = data['email'].strip().lower()
    password = data['password']
    
    # Validar formato
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    if '@' not in email:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Verificar si usuario ya existe
    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()
    
    if existing_user:
        return jsonify({'error': 'User or email already exists'}), 409
    
    try:
        # Crear nuevo usuario
        user = User(username=username, email=email, account_level='basic')
        user.set_password(password)
        db.session.add(user)
        db.session.flush()  # Para obtener el ID antes de commit
        
        # Crear wallets iniciales para el nuevo usuario
        initial_coins = [
            {'coin': 'USD', 'balance': 0.0},
            {'coin': 'flagcoin', 'balance': 0.0},
            {'coin': 'Bitcoin', 'balance': 0.0},
            {'coin': 'Ethereum', 'balance': 0.0},
            {'coin': 'CTFcoin', 'balance': 10.0},
        ]
        
        for coin_data in initial_coins:
            wallet = Wallet(user_id=user.id, **coin_data)
            db.session.add(wallet)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'account_level': user.account_level
            }
        }), 201
    
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': 'User or email already exists'}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login y obtener JWT token"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing username or password'}), 400
    
    username = data['username'].strip()
    password = data['password']
    
    # Buscar usuario
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Crear JWT token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'account_level': user.account_level
        }
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """Obtener perfil del usuario logueado"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Actualizar perfil del usuario"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Actualizar email si se proporciona
    if 'email' in data:
        new_email = data['email'].strip().lower()
        if '@' in new_email and new_email != user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({'error': 'Email already in use'}), 409
            user.email = new_email
    
    # Cambiar contraseña si se proporciona
    if 'new_password' in data and 'current_password' in data:
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        user.set_password(data['new_password'])
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500