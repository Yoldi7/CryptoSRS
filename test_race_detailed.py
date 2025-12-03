import requests
import time
import random
import string
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://localhost:5001/api"

def rand_str(n=8):
    return ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(n))

def register_random_user():
    username = f"test_detail_{rand_str(6)}"
    email = f"{username}@example.com"
    password = rand_str(10)
    r = requests.post(f"{API}/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    if r.status_code not in (200,201):
        raise RuntimeError(f"Register failed: {r.status_code} {r.text}")
    return username, password

def login(username, password):
    r = requests.post(f"{API}/auth/login", json={"username": username, "password": password})
    if r.status_code != 200:
        raise RuntimeError(f"Login failed: {r.status_code} {r.text}")
    token = r.json()['access_token']
    return {"Authorization": f"Bearer {token}"}

def get_wallet(headers):
    r = requests.get(f"{API}/trading/wallet", headers=headers)
    return r.json() if r.status_code == 200 else []

def create_market_sell_order(headers, coin="CTFcoin", amount=10.0, thread_id=0):
    """Crear orden de venta a precio de mercado"""
    start = time.time()
    r = requests.post(f"{API}/trading/create-order", headers=headers, json={
        "coin": coin,
        "amount": amount,
        "order_type": "SELL",
        "price_type": "market",
        "target_price": 0
    })
    elapsed = time.time() - start
    return {
        'thread_id': thread_id,
        'status': r.status_code,
        'response': r.json(),
        'elapsed': elapsed
    }

def main():
    username, password = register_random_user()
    print(f"Registered: {username} / {password}\n")
    headers = login(username, password)

    # Initial wallet
    wallet = get_wallet(headers)
    print("=== Wallet INICIAL ===")
    for w in wallet:
        locked = w.get('locked_balance', w.get('locked', 0.0))
        print(f"  {w['coin']}: balance={w['balance']:.8f}, locked={locked:.8f}, available={w['available']:.8f}")
    
    ctf_balance = next((w['balance'] for w in wallet if w['coin'] == 'CTFcoin'), 0.0)
    if ctf_balance <= 0:
        print("\nNo CTFcoin balance to test")
        return

    print(f"\n=== Lanzando 10 ventas paralelas de {ctf_balance} CTFcoin ===")
    
    results = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = [pool.submit(create_market_sell_order, headers, "CTFcoin", ctf_balance, i) for i in range(10)]
        for future in as_completed(futures):
            try:
                result = future.result()
                results.append(result)
                status_symbol = "✅" if result['status'] in (200, 201) else "❌"
                print(f"{status_symbol} Thread {result['thread_id']}: Status {result['status']} ({result['elapsed']:.3f}s)")
            except Exception as e:
                print(f"❌ Thread error: {e}")
    
    time.sleep(1)
    
    # Final wallet
    wallet = get_wallet(headers)
    print("\n=== Wallet FINAL ===")
    for w in wallet:
        locked = w.get('locked_balance', w.get('locked', 0.0))
        print(f"  {w['coin']}: balance={w['balance']:.8f}, locked={locked:.8f}, available={w['available']:.8f}")
    
    # Análisis
    success_count = sum(1 for r in results if r['status'] in (200, 201))
    error_count = len(results) - success_count
    
    ctf_final = next((w['balance'] for w in wallet if w['coin'] == 'CTFcoin'), 0.0)
    usd_final = next((w['balance'] for w in wallet if w['coin'] == 'USD'), 0.0)
    
    print(f"\n=== ANÁLISIS ===")
    print(f"Ventas lanzadas: 10")
    print(f"Ventas exitosas: {success_count}")
    print(f"Ventas fallidas: {error_count}")
    print(f"CTFcoin inicial: {ctf_balance:.8f}")
    print(f"CTFcoin final: {ctf_final:.8f}")
    print(f"CTFcoin vendido (teórico): {ctf_balance - ctf_final:.8f}")
    print(f"USD ganado: {usd_final:.2f}")
    print(f"USD esperado por 1 venta: {ctf_balance * 95:.2f}")
    print(f"Multiplicador: {usd_final / (ctf_balance * 95):.2f}x")
    
    if success_count > 1:
        print(f"\n⚠️  RACE CONDITION CONFIRMADA: Se vendieron {ctf_balance:.2f} CTFcoin {success_count} veces!")
    else:
        print("\n✅ Sin race condition detectada")
    
    # Mostrar errores
    if error_count > 0:
        print(f"\n=== Errores ({error_count}) ===")
        for r in results:
            if r['status'] not in (200, 201):
                error_msg = r['response'].get('error', 'Unknown error')
                print(f"  Thread {r['thread_id']}: {error_msg}")

if __name__ == "__main__":
    main()
