# CryptoSRS CTF - Trading Platform

Una plataforma de trading de criptomonedas vulnerable diseñada con fines educativos para demostrar vulnerabilidades de seguridad comunes.

## Arquitectura

```
┌─────────────────────────────────────────────┐
│                 USUARIO                     │
│            http://localhost:8080            │
└────────────────────┬────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │   WEB (Nginx)       │
          │  Puerto: 8080       │
          │  HTML/CSS/JS        │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │  API (Flask)        │
          │  Puerto: 5000       │
          │  - Auth             │
          │  - Trading          │
          │  - Bot              │
          │  - Flags            │
          └──────────┬──────────┘
                     │
          ┌──────────▼──────────┐
          │   DB (PostgreSQL)   │
          │  Puerto: 5432       │
          └─────────────────────┘
```

## Requisitos

- Docker
- Docker Compose

## Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <repositorio>
cd CryptoSRS-CTF
```

### 2. Crear estructura de directorios

```bash
mkdir -p api routes web/html web/css web/js
```

### 3. Copiar archivos

Coloca los siguientes archivos en sus respectivas ubicaciones:

**API:**
- `api/app.py`
- `api/config.py`
- `api/models.py`
- `api/requirements.txt`
- `api/routes/__init__.py`
- `api/routes/auth.py`
- `api/routes/trading.py`
- `api/routes/bot.py`
- `api/routes/flags.py`

**Frontend:**
- `web/html/index.html`
- `web/css/style.css`
- `web/js/api.js`
- `web/js/auth.js`
- `web/js/trading.js`
- `web/js/bot.js`
- `web/js/ui.js`
- `web/nginx.conf`

**Dockerfiles:**
- `Dockerfile.api`
- `Dockerfile.web`
- `docker-compose.yml`

### 4. Ejecutar los contenedores

```bash
docker-compose up -d
```

Esto iniciará:
- **PostgreSQL** en puerto 5432
- **API Flask** en puerto 5000
- **Frontend Nginx** en puerto 8080

### 5. Acceder a la aplicación

Abre tu navegador y ve a: **http://localhost:8080**

## Uso

### Registro
1. Haz clic en "Register"
2. Ingresa un nombre de usuario, email y contraseña
3. Se crearán automáticamente 10 CTFcoin en tu cartera

### Login
1. Ingresa tus credenciales
2. Accede al dashboard de trading

### Trading

#### Comprar Monedas
1. Selecciona una moneda en el selector
2. Ingresa la cantidad
3. Haz clic en "Buy"
4. Se te cobrará en CTFcoin

#### Crear Orden de Venta
1. Selecciona la moneda que deseas vender
2. Ingresa la cantidad y el precio objetivo
3. Haz clic en "Create Sell Order"
4. La moneda se bloqueará hasta que canceles la orden

#### Cancelar Orden (VULNERABLE)
1. En la sección "Sell Orders", verás tus órdenes pendientes
2. Haz clic en "Cancel"
- **Vulnerabilidad**: Ejecutar múltiples cancelaciones simultáneamente puede causar una race condition

### Bots (Premium)

Los bots son una característica premium disponible después de comprar `flagcoin`.

1. Navega a la sección "Bot"
2. Ingresa un nombre para el bot
3. Proporciona configuración en JSON
4. Haz clic en "Create Bot"

## Vulnerabilidades

### Nivel 1: Race Condition (User Flag)

**Ubicación**: `/api/trading/create-sell-order` y `/api/trading/cancel-order`

**Descripción**: El sistema no sincroniza correctamente el bloqueo de fondos entre crear y cancelar órdenes.

**Exploit**: Ejecutar múltiples solicitudes de cancelación simultáneamente para duplicar dinero.

**Resultado**: Obtener flagcoin y conseguir la flag de usuario.

### Nivel 2: Desserialización Pickle Débil (Shell Access)

**Ubicación**: `/api/bot/configure`

**Descripción**: El sistema deserializa configuración de bots usando `pickle.loads()` sin validación.

**Exploit**: Enviar un payload pickle malicioso que ejecute código arbitrario.

**Resultado**: Obtener acceso shell en la máquina.

### Nivel 3: SUID + Carga Dinámica (Root Flag)

**Ubicación**: Binario SUID que carga plugins desde `config.json`

**Descripción**: Un binario con permisos SUID carga librerías compartidas sin validación.

**Exploit**: Modificar `config.json` para cargar una librería maliciosa compilada.

**Resultado**: Obtener acceso root y la flag de admin.

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Ver perfil

### Trading
- `GET /api/trading/coins` - Ver precios de monedas
- `GET /api/trading/wallet` - Ver cartera
- `POST /api/trading/buy` - Comprar monedas
- `POST /api/trading/create-sell-order` - Crear orden de venta
- `POST /api/trading/cancel-order/<id>` - Cancelar orden
- `GET /api/trading/orders` - Ver órdenes

### Bots
- `POST /api/bot/configure` - Configurar bot
- `GET /api/bot/list` - Listar bots
- `POST /api/bot/<id>/activate` - Activar bot
- `POST /api/bot/<id>/deactivate` - Desactivar bot
- `DELETE /api/bot/<id>` - Eliminar bot

### Flags
- `GET /api/flags/user` - Obtener flag de usuario
- `GET /api/flags/admin` - Obtener flag de admin
- `GET /api/flags/status` - Ver progreso

## Parar los contenedores

```bash
docker-compose down
```

Para eliminar también los volúmenes de datos:

```bash
docker-compose down -v
```

## Logs

Ver logs de la API:
```bash
docker-compose logs -f api
```

Ver logs de la base de datos:
```bash
docker-compose logs -f db
```

## Notas de Seguridad

⚠️ **ESTO ES PARA FINES EDUCATIVOS SOLAMENTE**

- No uses credenciales reales en este sistema
- Cambia las contraseñas por defecto en `docker-compose.yml`
- Las vulnerabilidades son intencionales y deben ser parcheadas en código de producción
- No expongas esta aplicación en internet

## Contribuidores

Proyecto para trabajo final de universidad - CTF Security Challenge

## Licencia

MIT