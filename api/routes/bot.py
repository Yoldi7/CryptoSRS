from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pickle
import base64
from models import db, User, Bot

bot_bp = Blueprint('bot', __name__)

@bot_bp.route('/configure', methods=['POST'])
@jwt_required()
def configure_bot():
    """
    Configurar un nuevo bot
    VULNERABLE A DESSERIALIZACIÓN PICKLE
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Verificar que el usuario sea premium
    if user.account_level != 'premium':
        return jsonify({'error': 'Only premium users can create bots'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('config'):
        return jsonify({'error': 'Missing name or config'}), 400
    
    name = data['name'].strip()
    config_encoded = data['config']
    
    if len(name) < 3 or len(name) > 100:
        return jsonify({'error': 'Name must be between 3 and 100 characters'}), 400
    
    try:
        # VULNERABLE: Desserialización insegura de pickle
        # El atacante puede enviar un payload que ejecute código arbitrario
        config_decoded = base64.b64decode(config_encoded)
        
        # ESTE ES EL PUNTO VULNERABLE
        # pickle.loads() puede deserializar objetos maliciosos
        bot_config = pickle.loads(config_decoded)
        
        print(f"[DEBUG] Bot config deserializado: {bot_config}")
        
        # Crear bot
        bot = Bot(
            user_id=user_id,
            name=name,
            config=config_encoded,  # Guardar la versión codificada
            is_active=False
        )
        db.session.add(bot)
        db.session.commit()
        
        return jsonify({
            'message': 'Bot configured successfully',
            'bot': bot.to_dict()
        }), 201
    
    except pickle.UnpicklingError as e:
        return jsonify({'error': f'Invalid pickle data: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        # VULNERABLE: Aquí el error podría revelar información sensible
        return jsonify({'error': f'Error configuring bot: {str(e)}'}), 500

@bot_bp.route('/list', methods=['GET'])
@jwt_required()
def list_bots():
    """Listar bots del usuario"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    bots = Bot.query.filter_by(user_id=user_id).all()
    
    return jsonify({
        'bots': [bot.to_dict() for bot in bots]
    }), 200

@bot_bp.route('/<int:bot_id>', methods=['GET'])
@jwt_required()
def get_bot(bot_id):
    """Obtener detalles de un bot"""
    user_id = get_jwt_identity()
    
    bot = Bot.query.get(bot_id)
    
    if not bot:
        return jsonify({'error': 'Bot not found'}), 404
    
    if bot.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(bot.to_dict()), 200

@bot_bp.route('/<int:bot_id>/activate', methods=['POST'])
@jwt_required()
def activate_bot(bot_id):
    """Activar un bot"""
    user_id = get_jwt_identity()
    
    bot = Bot.query.get(bot_id)
    
    if not bot:
        return jsonify({'error': 'Bot not found'}), 404
    
    if bot.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        bot.is_active = True
        db.session.commit()
        
        return jsonify({
            'message': 'Bot activated',
            'bot': bot.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bot_bp.route('/<int:bot_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_bot(bot_id):
    """Desactivar un bot"""
    user_id = get_jwt_identity()
    
    bot = Bot.query.get(bot_id)
    
    if not bot:
        return jsonify({'error': 'Bot not found'}), 404
    
    if bot.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        bot.is_active = False
        db.session.commit()
        
        return jsonify({
            'message': 'Bot deactivated',
            'bot': bot.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bot_bp.route('/<int:bot_id>', methods=['DELETE'])
@jwt_required()
def delete_bot(bot_id):
    """Eliminar un bot"""
    user_id = get_jwt_identity()
    
    bot = Bot.query.get(bot_id)
    
    if not bot:
        return jsonify({'error': 'Bot not found'}), 404
    
    if bot.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        db.session.delete(bot)
        db.session.commit()
        
        return jsonify({
            'message': 'Bot deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500