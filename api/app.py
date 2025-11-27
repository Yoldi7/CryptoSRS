import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import datetime

from config import get_config
from models import db, User, Wallet, CoinPrice

def create_app():
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    
    # Cargar configuración
    config = get_config()
    app.config.from_object(config)
    
    # Inicializar extensiones
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})
    jwt = JWTManager(app)
    
    # Registrar blueprints
    from routes.auth import auth_bp
    from routes.trading import trading_bp
    from routes.bot import bot_bp
    from routes.flags import flags_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(trading_bp, url_prefix='/api/trading')
    app.register_blueprint(bot_bp, url_prefix='/api/bot')
    app.register_blueprint(flags_bp, url_prefix='/api/flags')
    
    # Crear contexto de aplicación
    with app.app_context():
        # Crear tablas
        db.create_all()
        
        # Inicializar monedas si no existen
        init_coins()
        init_test_user()
    
    # Manejadores de errores
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()}), 200
    
    return app

def init_coins():
    """Inicializar precios de monedas"""
    coins = [
        {'coin': 'FlagCoin', 'buy_price': 1000.0, 'sell_price': 950.0},
        {'coin': 'BitCoin', 'buy_price': 50000.0, 'sell_price': 49500.0},
        {'coin': 'PribaitCoin', 'buy_price': 3000.0, 'sell_price': 2950.0},
        {'coin': 'CTFcoin', 'buy_price': 100.0, 'sell_price': 95.0},
    ]
    
    for coin_data in coins:
        coin = CoinPrice.query.filter_by(coin=coin_data['coin']).first()
        if not coin:
            coin = CoinPrice(**coin_data)
            db.session.add(coin)
    
    db.session.commit()

def init_test_user():
    """Inicializar un usuario de prueba con 10 CTFcoin si no existe."""
    test_user = User.query.filter_by(username='test').first()
    if not test_user:
        test_user = User(
            username='test',
            email='test@gmail.com',
            account_level='basic'
        )
        test_user.set_password('123456')
        db.session.add(test_user)
        db.session.commit()

        # Crear cartera para el usuario de prueba
        test_wallet = Wallet.query.filter_by(user_id=test_user.id, coin='CTFcoin').first()
        if not test_wallet:
            test_wallet = Wallet(user_id=test_user.id, coin='CTFcoin', balance=10.0, locked_balance=0.0)
            db.session.add(test_wallet)
            db.session.commit()
    else:
        print("Usuario de prueba ya existe. No se realizaron cambios.")

if __name__ == '__main__':
    app = create_app()

    
    app.run(host='0.0.0.0', port=5000, debug=False)