from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Wallet, Order, CoinPrice
from datetime import datetime
import time

trading_bp = Blueprint('trading', __name__)

@trading_bp.route('/create-order', methods=['POST'])
@jwt_required()
def create_order():
    """Crear una nueva orden de compra/venta"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    coin_name = data.get('coin')
    amount = float(data.get('amount', 0))
    order_type = data.get('order_type') # BUY or SELL
    price_type = data.get('price_type', 'limit') # market or limit
    target_price = float(data.get('target_price', 0))
    
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
        
    # Verificar precio actual
    coin_price = CoinPrice.query.filter_by(coin=coin_name).first()
    if not coin_price:
        return jsonify({'error': 'Coin not found'}), 404
        
    if price_type == 'market':
        target_price = coin_price.buy_price if order_type == 'BUY' else coin_price.sell_price
    
    # Verificar fondos y bloquear
    if order_type == 'BUY':
        # Necesitamos USD
        total_cost = amount * target_price
        wallet = Wallet.query.filter_by(user_id=user_id, coin='USD').first()
        if not wallet or wallet.balance - wallet.locked_balance < total_cost:
            return jsonify({'error': 'Insufficient USD funds'}), 400
            
        wallet.locked_balance += total_cost
        
    elif order_type == 'SELL':
        # Necesitamos la moneda
        wallet = Wallet.query.filter_by(user_id=user_id, coin=coin_name).first()
        if not wallet or wallet.balance - wallet.locked_balance < amount:
            return jsonify({'error': f'Insufficient {coin_name} funds'}), 400
            
        wallet.locked_balance += amount
    else:
        return jsonify({'error': 'Invalid order type'}), 400
        
    # Crear orden
    order = Order(
        user_id=user_id,
        coin=coin_name,
        amount=amount,
        order_type=order_type,
        price_type=price_type,
        target_price=target_price,
        status='pending'
    )
    
    db.session.add(order)
    db.session.commit()
    
    return jsonify({
        'message': 'Order created',
        'order': order.to_dict()
    }), 201
# ----------- New GET endpoints ----------
@trading_bp.route('/coins', methods=['GET'])
def get_coins():
    """Obtener lista de precios de monedas"""
    coins = CoinPrice.query.all()
    return jsonify([coin.to_dict() for coin in coins]), 200

@trading_bp.route('/wallet', methods=['GET'])
@jwt_required()
def get_wallet():
    """Obtener la cartera del usuario autenticado"""
    user_id = get_jwt_identity()
    wallets = Wallet.query.filter_by(user_id=user_id).all()
    return jsonify([w.to_dict() for w in wallets]), 200

@trading_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """Obtener órdenes del usuario autenticado"""
    user_id = get_jwt_identity()
    orders = Order.query.filter_by(user_id=user_id).all()
    return jsonify([o.to_dict() for o in orders]), 200

# ------------------------------------------------
@trading_bp.route('/execute-order/<int:order_id>', methods=['POST'])
@jwt_required()
def execute_order(order_id):
    """Ejecutar una orden (VULNERABLE A RACE CONDITION)"""
    user_id = get_jwt_identity()
    
    # VULNERABILIDAD: No usamos with_for_update() para bloquear la fila
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if order.status != 'pending':
        return jsonify({'error': 'Order already processed'}), 400
        
    # Simular retardo para facilitar la Race Condition
    time.sleep(0.2)
    
    # Procesar transacción
    usd_wallet = Wallet.query.filter_by(user_id=user_id, coin='USD').first()
    coin_wallet = Wallet.query.filter_by(user_id=user_id, coin=order.coin).first()
    
    if not coin_wallet:
        coin_wallet = Wallet(user_id=user_id, coin=order.coin, balance=0.0)
        db.session.add(coin_wallet)
    
    if order.order_type == 'BUY':
        total_cost = order.amount * order.target_price
        
        # Desbloquear y descontar USD
        usd_wallet.locked_balance -= total_cost
        usd_wallet.balance -= total_cost
        
        # Añadir moneda
        coin_wallet.balance += order.amount
        
    elif order.order_type == 'SELL':
        total_gain = order.amount * order.target_price
        
        # Desbloquear y descontar moneda
        coin_wallet.locked_balance -= order.amount
        coin_wallet.balance -= order.amount
        
        # Añadir USD
        usd_wallet.balance += total_gain
        
    order.status = 'completed'
    order.executed_price = order.target_price
    order.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Order executed',
        'order': order.to_dict()
    }), 200

@trading_bp.route('/cancel-order/<int:order_id>', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    """Cancelar una orden (VULNERABLE A RACE CONDITION)"""
    user_id = get_jwt_identity()
    
    # VULNERABILIDAD: No bloqueamos la fila
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
        
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if order.status != 'pending':
        return jsonify({'error': 'Order already processed'}), 400
        
    # Simular retardo
    time.sleep(0.2)
    
    # Devolver fondos bloqueados
    if order.order_type == 'BUY':
        total_cost = order.amount * order.target_price
        wallet = Wallet.query.filter_by(user_id=user_id, coin='USD').first()
        wallet.locked_balance -= total_cost
        
    elif order.order_type == 'SELL':
        wallet = Wallet.query.filter_by(user_id=user_id, coin=order.coin).first()
        wallet.locked_balance -= order.amount
        
    order.status = 'cancelled'
    db.session.commit()
    
    return jsonify({
        'message': 'Order cancelled',
        'order': order.to_dict()
    }), 200
