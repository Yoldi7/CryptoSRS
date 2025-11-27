from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    """Modelo de Usuario"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    account_level = db.Column(db.String(20), default='basic')  # basic, premium
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    wallets = db.relationship('Wallet', backref='user', cascade='all, delete-orphan', lazy=True)
    orders = db.relationship('Order', backref='user', cascade='all, delete-orphan', lazy=True)
    bots = db.relationship('Bot', backref='user', cascade='all, delete-orphan', lazy=True)
    
    def set_password(self, password):
        """Hashear contraseña"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verificar contraseña"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convertir a diccionario"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'account_level': self.account_level,
            'created_at': self.created_at.isoformat(),
            'wallets': [wallet.to_dict() for wallet in self.wallets]
        }

class Wallet(db.Model):
    """Modelo de Cartera"""
    __tablename__ = 'wallets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    coin = db.Column(db.String(20), nullable=False)  # USD, flagcoin, Bitcoin, etc.
    balance = db.Column(db.Float, default=0.0)
    locked_balance = db.Column(db.Float, default=0.0)  # Fondos reservados para órdenes pendientes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'coin', name='unique_user_coin'),
    )
    
    def to_dict(self):
        return {
            'coin': self.coin,
            'balance': self.balance,
            'locked_balance': self.locked_balance,
            'available': self.balance - self.locked_balance
        }

class CoinPrice(db.Model):
    """Modelo de Precios de Monedas"""
    __tablename__ = 'coin_prices'
    
    id = db.Column(db.Integer, primary_key=True)
    coin = db.Column(db.String(20), unique=True, nullable=False, index=True)
    buy_price = db.Column(db.Float, nullable=False)  # Precio de compra
    sell_price = db.Column(db.Float, nullable=False)  # Precio de venta
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'coin': self.coin,
            'buy_price': self.buy_price,
            'sell_price': self.sell_price,
            'spread': self.buy_price - self.sell_price
        }

class Order(db.Model):
    """Modelo de Órdenes (VULNERABLE a Race Condition)"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    coin = db.Column(db.String(20), nullable=False)  # Moneda a comprar/vender
    amount = db.Column(db.Float, nullable=False)  # Cantidad de moneda
    order_type = db.Column(db.String(10), nullable=False)  # 'BUY' o 'SELL'
    status = db.Column(db.String(20), default='pending')  # pending, completed, cancelled
    target_price = db.Column(db.Float, nullable=False)  # Precio objetivo en USD
    executed_price = db.Column(db.Float, nullable=True)  # Precio al que se ejecutó
    price_type = db.Column(db.String(20), default='limit')  # 'market' o 'limit'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'coin': self.coin,
            'amount': self.amount,
            'order_type': self.order_type,
            'status': self.status,
            'target_price': self.target_price,
            'executed_price': self.executed_price,
            'price_type': self.price_type,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class Bot(db.Model):
    """Modelo de Bot (VULNERABLE a Deserialización Pickle)"""
    __tablename__ = 'bots'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    config = db.Column(db.Text, nullable=False)  # Configuración en formato pickle (codificado en base64)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }