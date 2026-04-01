🌐 **Language / 言語 / Ngôn ngữ:** [English](SETUP_GUIDE.md) | [日本語](SETUP_GUIDE_JP.md) | Tiếng Việt

# Hướng dẫn cài đặt và chạy Hydra Hexcore

Dự án hỗ trợ **2 chế độ kết nối** vào mạng Cardano:

|             | Chế độ Blockfrost                | Chế độ Cardano Node                            |
| ----------- | -------------------------------- | ---------------------------------------------- |
| **Độ khó**  | ⭐ Dễ — chỉ cần API key          | ⭐⭐⭐ Khó — phải tự chạy full node            |
| **Yêu cầu** | Tài khoản Blockfrost             | Đã chạy thành công `cardano-node`              |
| **Ưu điểm** | Nhanh, không cần sync blockchain | Không phụ thuộc bên thứ 3, có thể chạy offline |

> Chọn **một trong hai** chế độ và làm theo hướng dẫn tương ứng bên dưới.

---

# Phần A — Chạy bằng Blockfrost

## A1. Yêu cầu hệ thống

- **Node.js** >= 20.x
- **pnpm** — cài đặt: `npm install -g pnpm`
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- Tài khoản **Blockfrost** (đăng ký miễn phí tại [blockfrost.io](https://blockfrost.io))

---

## A2. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## A3. Cấu hình môi trường (.env)

Copy file mẫu:

```bash
cp .env.example .env
```

Sau đó mở file `.env` và chỉnh sửa các biến theo hướng dẫn bên dưới.

### A3.1. Chế độ kết nối Cardano → Blockfrost

```dotenv
# Chọn chế độ kết nối
CARDANO_CONNECTION_MODE=blockfrost

# Lấy Project ID từ https://blockfrost.io/dashboard
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Base URL của Blockfrost API (chọn đúng mạng: preprod hoặc mainnet)
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
```

> **Lưu ý:** Khi tạo project trên Blockfrost, chọn mạng **Preprod** để lấy Project ID tương ứng.

### A3.2. Cấu hình Hydra Node

```dotenv
# Mạng Cardano đang dùng: testnet hoặc mainnet
# testnet → dùng --testnet-magic <NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID>
# mainnet → dùng --mainnet (bỏ qua NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID)
CARDANO_NETWORK='testnet'

NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### Cách lấy `NEST_HYDRA_NODE_IMAGE`

Xem danh sách phiên bản tại: [https://github.com/cardano-scaling/hydra/releases](https://github.com/cardano-scaling/hydra/releases)

Format: `ghcr.io/cardano-scaling/hydra-node:<version>`

```text
ghcr.io/cardano-scaling/hydra-node:1.2.0   # Khuyến nghị
ghcr.io/cardano-scaling/hydra-node:1.1.0
ghcr.io/cardano-scaling/hydra-node:1.0.0
ghcr.io/cardano-scaling/hydra-node:0.21.0
```

#### Cách lấy `NEST_HYDRA_NODE_SCRIPT_TX_ID`

Mỗi phiên bản Hydra đều publish sẵn **Script TX IDs** cho từng mạng. Bạn cần lấy đúng TX ID tương ứng với phiên bản và mạng đang dùng.

**Bước 1:** Vào trang release của phiên bản đó:

```text
https://github.com/cardano-scaling/hydra/releases/tag/<version>
```

**Bước 2:** Tìm mục **"Hydra Scripts"**, lấy TX IDs tương ứng với mạng (`preview`, `preprod`, hoặc `mainnet`).

**Bước 3:** Hoặc truy cập trực tiếp file `networks.json`:

```text
https://raw.githubusercontent.com/cardano-scaling/hydra/<version>/hydra-node/networks.json
```

Bảng tham khảo nhanh:

<details>
<summary><b>📋 Hydra v1.2.0 (mới nhất - khuyến nghị)</b></summary>

| Mạng        | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `3c275192a7b5ff199f2f3182f508e10f7e1da74a50c4c673ce0588b8c621ed45,`<br>`6f8a4b6404d4fdd0254507e95392fee6a983843eb168f9091192cbec2b99f83d,`<br>`60d61b2f10897bf687de440a0a8b348a57b1fc3786b7b8b1379a65ace1de199a` |
| **preprod** | `ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,`<br>`ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,`<br>`4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3` |
| **mainnet** | `e2512f44bb43f9c44dc3db495ce6a8ba6db6d8afaad2e3494b32d591845fb259,`<br>`a5e683efe3acd02b7a1d0c13d1517672b2c78a74abd08dd455c34290150ea4d7,`<br>`d0f70c628778a7d2e71ab366ad6112890b5fa5596ef553bc18accf66875af203` |

</details>

<details>
<summary><b>📋 Hydra v1.1.0</b></summary>

| Mạng        | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `ee449c99464c5419954f39b98e513b17406e24c9883e6342e073006e54878524,`<br>`d6e03afa86cf1d74011ba234ec32fbd102d4332c3891a49419dae318281bc96a,`<br>`0b32f7cf144090b3a2d6787cb5b4cabbc0a72c1ae77bf72de8e3d9aa9476bfb7` |
| **preprod** | `407bf714186db790f2624701b2e065850dd7b7cf998c931222d99a56d8ad256b,`<br>`4cae9ad9c1cc4f82ce2fd51f9e1155a37ac88957f81128ba1c51bc7c6734ce6c,`<br>`a3a27a3049be1fe931a0d99bf132a88b848b12dc50f50856cb86e12bb135f5d2` |
| **mainnet** | `f6ef3adbfdc6a6cbf63ec160cc9a61ca58ce63a0ba52f8f3fe6b5acb19e14ab8,`<br>`a699520a621bcc73918cf52ad8dfb097481573a43b9fb704f2b91df4ee56502c,`<br>`6a9562c2fce83951f90e72df8d7ecc9e2db48f3202ba15a55622474975c069b9` |

</details>

<details>
<summary><b>📋 Hydra v1.0.0</b></summary>

| Mạng        | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `08fea9f21fec08d47dd56cd632ece001616b247f6e2e893f98dcf1e69ddb58d0,`<br>`c6ba286b501c076ee494b4686e681c5aab8f903d930e8366dcbca1c3530264ee,`<br>`ed6b3ff639fb99b18916dd14b9837d893b1a053af38a27f604a7cdf543b86f6c` |
| **preprod** | `e10437a6913ca5f708c3f15cc6f06792b85459f32883c9ed3fac5659f2ba383f,`<br>`f217f72b3202ab0299e700e69094452ce177ecbc90daa461abceff7b32fb9898,`<br>`05ba60bb792572428a0128f655c6ec67966000886132697ed02d884b69fce472` |
| **mainnet** | `84cde037c71b6cb80755738459f63fb1c7cdea22beff1cb8e23cd7f9916f5696,`<br>`2a725d14075e4ce325569bcf6d0b4c98d9f5495b4bfa2d32de70c5ea4611b7cf,`<br>`d0e542221a0e1949b0d79e8ebdf987395dce097411a89e886bb897408c2cc878` |

</details>

<details>
<summary><b>📋 Hydra v0.21.0</b></summary>

| Mạng        | Script TX IDs                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **preview** | `bdf8a262cd5e7c8f4961aed865c026d5b6314b22a4bc31e981363b5bb50d1da6,`<br>`0dbb43e152647c729c365aa18fce20133a212c6b43252fa25dbb7c0cf65ae011,`<br>`54aec058e43e5cfe5161e8f97cc43f4601da180dc8ac13f3f39eb2fa08148a01` |
| **preprod** | `557b6a6eaf6177407757cb82980ebc5b759b150ccfd329e1d8f81bbd16fecb01,`<br>`98e1a40224c5ed8eaff5fc1f865d89af47ae89fd4adc1c37fc80dfd901b0caf2,`<br>`8fbdf7de4934ca4d22ed9cfac0f6e2566990751b6f4b944470dafabbd079b965` |
| **mainnet** | `b5d5fa4d367005bdd6449dcca049aa61aa8b59a907231b03bb006eda01e8e73a,`<br>`696ec03023309d8e75f983d4285880dcfcfac58c06808e0191ef075f10034212,`<br>`48e09f38b208f4f30b1fe29232f450cfea88ffc9393ac34b1069dddce2758e8d` |

</details>

> **Quan trọng:** Script TX IDs **phải khớp** với phiên bản Docker Image (`NEST_HYDRA_NODE_IMAGE`). Ví dụ: dùng image `1.2.0` thì phải lấy TX IDs của phiên bản `1.2.0`.

#### Cách chọn `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`

| Mạng                  | Giá trị                                      |
| --------------------- | -------------------------------------------- |
| **Preview** (testnet) | `2`                                          |
| **Preprod** (testnet) | `1`                                          |
| **Mainnet**           | Không cần (dùng `CARDANO_NETWORK='mainnet'`) |

> Khi `CARDANO_NETWORK='mainnet'`, hệ thống tự dùng `--mainnet` và bỏ qua biến này.

Ví dụ cấu hình đầy đủ cho mạng **Preprod**:

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### Bảng tương thích phiên bản

| Hydra Version | cardano-node | cardano-cli |
| ------------- | ------------ | ----------- |
| **1.2.0**     | 10.5.3       | 10.11.0.0   |
| **1.1.0**     | —            | —           |
| **1.0.0**     | 10.4.1       | 10.8.0.0    |
| **0.21.0**    | 10.1.4       | 10.1.1.0    |

### A3.3. Cấu hình Database (MySQL)

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true
```

### A3.4. Cấu hình Docker

```dotenv
# Linux / macOS
NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'
```

### A3.5. Cấu hình JWT & Hydra Hub

```dotenv
# Secret key dùng để ký JWT (đặt chuỗi ngẫu nhiên đủ dài)
JWT_SECRET=your_jwt_secret_key

# Base URL của Hydra Hub API
# dev:  https://dev-api.hydrahub.io.vn/
# uat:  https://uat-api.hydrahub.io.vn/
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/

# API Key — được gửi qua email sau khi provider được Hydra Hub Team phê duyệt
HUB_API_KEY=your_hub_api_key
```

### A3.6. Giới hạn & Cấu hình khác

```dotenv
# Số lượng Hydra Node có thể active đồng thời
MAX_ACTIVE_NODES=20
```

### A3.7. Port & Log

```dotenv
PORT=3010
LOG_DIR=logs
```

### A3.8. Cấu hình RabbitMQ

Hệ thống dùng **RabbitMQ** để giao tiếp metric với **Hydra Hub**. Thông tin kết nối sẽ được **gửi qua email** khi provider được phê duyệt.

```dotenv
# Bật/tắt kết nối RabbitMQ (mặc định: false)
RABBITMQ_ENABLED=false

# Các giá trị bên dưới được cung cấp qua email khi provider được duyệt
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue

# Các giá trị tự cấu hình
RABBITMQ_PREFETCH_COUNT=1
RABBITMQ_NO_ACK=false
RABBITMQ_QUEUE_DURABLE=true
```

| Biến môi trường           | Giá trị mặc định                    | Nguồn       | Mô tả                                     |
| ------------------------- | ----------------------------------- | ----------- | ----------------------------------------- |
| `RABBITMQ_ENABLED`        | `false`                             | Tự cấu hình | Bật/tắt kết nối RabbitMQ                  |
| `RABBITMQ_URI`            | `amqp://guest:guest@localhost:5672` | **Email**   | URI kết nối AMQP (user, pass, host, port) |
| `RABBITMQ_EXCHANGE`       | `provider.metrics`                  | **Email**   | Tên topic exchange                        |
| `RABBITMQ_QUEUE`          | `hexcore.queue`                     | **Email**   | Tên queue                                 |
| `RABBITMQ_PREFETCH_COUNT` | `1`                                 | Tự cấu hình | Số message prefetch mỗi consumer          |
| `RABBITMQ_NO_ACK`         | `false`                             | Tự cấu hình | Auto-acknowledge message                  |
| `RABBITMQ_QUEUE_DURABLE`  | `true`                              | Tự cấu hình | Queue tồn tại sau khi RabbitMQ restart    |

> **Lưu ý:** `RABBITMQ_URI`, `RABBITMQ_EXCHANGE`, `RABBITMQ_QUEUE` sẽ được gửi qua email sau khi provider được phê duyệt. Không tự ý thay đổi nếu không có hướng dẫn từ Hub.

---

## A4. Khởi chạy MySQL bằng Docker Compose

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

Sau khi khởi chạy:

| Service | Host      | Port | Username     | Password         |
| ------- | --------- | ---- | ------------ | ---------------- |
| MySQL   | localhost | 3327 | hexcore_user | hexcore_password |

> Đảm bảo file `.env` có đúng `DB_PORT=3327` và `DB_PASSWORD=hexcore_password`.

---

## A5. Phân quyền thư mục

```bash
# Tạo thư mục logs
mkdir -p logs
chmod -R 755 logs

# Tạo thư mục lưu dữ liệu Hydra Node (persistence và keys)
mkdir -p /path/to/hydra/preprod
chmod -R 755 /path/to/hydra/preprod

# Cho phép Docker socket truy cập (thêm user vào group docker)
sudo usermod -aG docker $USER
```

> Thay `/path/to/hydra/preprod` bằng đường dẫn đã cấu hình trong `NEST_HYDRA_NODE_FOLDER`.

---

## A6. Chạy dự án

```bash
pnpm build
pnpm start:prod
```

Server khởi chạy tại:

- **API:** `http://localhost:3010`
- **Swagger:** `http://localhost:3010/api-docs`

---

## A7. Tạo tài khoản Admin & Đăng ký Provider

Sau khi server đã chạy và database đã sync, chạy lệnh sau để tạo admin và đăng ký provider lên Hydra Hub:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --logo-url=https://example.com/logo.png \
  --provider-url=https://example.com \
  --connection-type=blockfrost \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

**Giải thích các tham số:**

| Tham số              | Bắt buộc | Mô tả                                                             |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `--username=`        | ✅       | Tên đăng nhập cho tài khoản admin                                 |
| `--password=`        | ✅       | Mật khẩu admin — tối thiểu **8 ký tự**, nên dùng mật khẩu mạnh    |
| `--ip=`              | ✅       | Địa chỉ IPv4 public của server (vd: `1.2.3.4`)                    |
| `--provider-name=`   | ✅       | Tên hiển thị của provider trên Hydra Hub                          |
| `--logo-url=`        | ❌       | URL ảnh logo của provider                                         |
| `--provider-url=`    | ❌       | URL website của provider/công ty                                  |
| `--connection-type=` | ✅       | Chế độ kết nối: `blockfrost` hoặc `cardano_node`                  |
| `--network=`         | ✅       | Mạng Cardano: `mainnet`, `preprod`, hoặc `preview`                |
| `--hexcore-url=`     | ✅       | Domain API công khai của provider (vd: `https://api.example.com`) |
| `--email=`           | ✅       | Email nhận **HUB API Key** — Hub sẽ gửi key về địa chỉ này        |

Khi chạy thành công, seeder sẽ:

1. Xóa toàn bộ user cũ và tạo tài khoản admin mới trong database
2. Tự động đăng nhập và lấy **Access Token**
3. Gửi thông tin lên **Hydra Hub** để đăng ký provider
4. Hub team phê duyệt xong → **HUB API Key** sẽ được gửi về email `--email=`

> **Về HUB API Key:** Đây là key dùng để xác thực các request từ Hub gửi về server của bạn. Sau khi nhận được, cập nhật vào `.env` với biến `HUB_API_KEY`.

Output mẫu khi chạy thành công:

```text
Starting create account admin seeder...
  ✓ Admin account created with username: admin
Access token: eyJhbGciOi...
ID: 1
Code: PRV-XXXX
Name: My Provider
Logo Url: https://example.com/logo.png
Url: https://example.com
Is Verified: false
IP: 1.2.3.4
Connection Type: blockfrost
Network: preprod
Domain: https://api.example.com
Access Token: eyJhbGciOi...
Webhook Key: whk_XXXX...
Email: contact@example.com
Process finished successfully.
```

> **Lưu ý:** Seeder sẽ **xóa toàn bộ user cũ** trước khi tạo admin mới. Đảm bảo `HYDRA_HUB_API_BASE_URL` đã được cấu hình đúng trong `.env`.

### A7.1. Cập nhật thông tin Provider

Nếu cần thay đổi thông tin provider (tên, URL, logo, ...), chạy lại lệnh seeder với các tham số mới. **Giữ nguyên `--ip=`** để hệ thống nhận diện đây là cập nhật provider hiện tại, không phải đăng ký mới:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_new_password \
  --ip=1.2.3.4 \
  --provider-name="My Updated Provider" \
  --logo-url=https://example.com/new-logo.png \
  --provider-url=https://example.com \
  --connection-type=blockfrost \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

> **Lưu ý:**
>
> - Nếu `--ip=` bị đổi khác với IP đang đăng ký, hệ thống sẽ xử lý như một **provider mới**.
> - Sau khi cập nhật, vẫn cần chờ Hub Team **xét duyệt lại**. Nếu được duyệt, HUB API Key và các cấu hình liên quan có thể được cập nhật và gửi lại qua email.

---

## A8. Sử dụng API _(tùy chọn)_

Sau khi provider được phê duyệt:

1. Truy cập **Swagger UI** tại `http://localhost:3010/api-docs`
2. Đăng nhập với tài khoản admin để lấy JWT token
3. Dùng token để gọi API quản lý Hydra Head

---

## Tổng hợp các bước nhanh (Blockfrost)

```bash
# 1. Cài đặt
pnpm install

# 2. Cấu hình .env
cp .env.example .env
# Chỉnh sửa .env theo hướng dẫn ở trên

# 3. Khởi chạy database
cd configs/mysql-databases && docker compose up -d && cd ../..

# 4. Phân quyền thư mục
mkdir -p logs && chmod -R 755 logs

# 5. Chạy server
pnpm build
pnpm start:prod

# 6. Tạo admin & đăng ký provider (mở terminal khác)
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --connection-type=blockfrost \
  --network=preprod \
  --hexcore-url=https://your-domain.com \
  --email=contact@example.com
```

---

## Xử lý lỗi thường gặp (Blockfrost)

| Lỗi                                       | Nguyên nhân                     | Cách khắc phục                                              |
| ----------------------------------------- | ------------------------------- | ----------------------------------------------------------- |
| `BlockFrost API configuration is missing` | Chưa cấu hình Blockfrost        | Kiểm tra `BLOCKFROST_PROJECT_ID` trong `.env`               |
| `ECONNREFUSED 127.0.0.1:3309`             | MySQL chưa chạy                 | Chạy `docker compose up -d` trong `configs/mysql-databases` |
| `EACCES: permission denied`               | Không có quyền ghi thư mục      | Chạy `chmod -R 755` cho thư mục tương ứng                   |
| `connect ENOENT /var/run/docker.sock`     | Docker daemon chưa chạy         | Khởi động Docker service                                    |
| `ECONNREFUSED 127.0.0.1:5672` (RabbitMQ)  | RabbitMQ chưa chạy hoặc sai URI | Kiểm tra RabbitMQ service và `RABBITMQ_URI` trong `.env`    |

---

# Phần B — Chạy bằng Cardano Node

> ⚠️ **Điều kiện tiên quyết:** Bạn cần đã có kinh nghiệm cài đặt và chạy `cardano-node`. Nếu chưa, hãy thử **Phần A** (Blockfrost) trước.

## B1. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## B2. Chạy Cardano Node

Trước khi tiếp tục, đảm bảo bạn đã nắm rõ về Cardano Node đang chạy:

- **Tên container** (hoặc cách gọi `cardano-cli`)
- **Đường dẫn thư mục** chứa `node.socket` và `shelley-genesis.json` trên máy host
- **Đường dẫn `node.socket`** bên trong container

> **Quan trọng:** Phải đợi cardano-node **đồng bộ xong blockchain** trước khi tiếp tục. Quá trình này có thể mất **vài giờ đến vài ngày** tuỳ mạng.
>
> ```bash
> # Theo dõi tiến trình sync
> docker logs -f cardano-node
> ```

Kiểm tra trạng thái sync:

```bash
docker exec cardano-node cardano-cli query tip \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

Khi `syncProgress` trả về `"100.00"` là đã sync xong.

---

## B3. Phân quyền cho `node.socket`

Bắt buộc phân quyền `777` để Hydra Node container có thể truy cập socket:

```bash
# Phân quyền riêng cho file node.socket
chmod 777 /path/to/cardano-node/node.socket

# Phân quyền cho toàn bộ thư mục cardano-node
chmod -R 777 /path/to/cardano-node/
```

Nếu dùng Docker Compose mặc định của dự án:

```bash
chmod 777 configs/cardano/node.socket
chmod -R 777 configs/cardano/
```

> ⚠️ Nếu bỏ qua bước này, Hydra Node sẽ báo lỗi `permission denied` hoặc `ENOENT node.socket` khi active head.

---

## B4. Cấu hình môi trường (.env)

```bash
cp .env.example .env
```

### Chế độ kết nối → Cardano Node

```dotenv
CARDANO_CONNECTION_MODE=cardano-node

# Mạng Cardano: testnet hoặc mainnet
CARDANO_NETWORK='testnet'
```

### Cấu hình Cardano Node

```dotenv
# Tên container cardano-node (phải trùng với container_name trong docker-compose)
NEST_CARDANO_NODE_SERVICE_NAME='cardano-node'

# Docker image cardano-node (xem bảng tương thích bên dưới)
NEST_CARDANO_NODE_IMAGE='ghcr.io/intersectmbo/cardano-node:10.2.1'

# Đường dẫn TUYỆT ĐỐI đến thư mục chứa file cấu hình cardano-node trên host
# (thư mục này chứa node.socket, shelley-genesis.json, config.json, ...)
# Sẽ được mount vào /cardano-node bên trong Hydra container
NEST_CARDANO_NODE_FOLDER='/home/user/hydra-hexcore/configs/cardano'

# Đường dẫn TUYỆT ĐỐI đến file node.socket trên host
NEST_CARDANO_NODE_SOCKET_PATH='/home/user/hydra-hexcore/configs/cardano/node.socket'
```

### Cấu hình Hydra Node

Cách lấy Script TX ID và Network ID xem tại [A3.2](#a32-cấu-hình-hydra-node).

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/home/user/hydra-hexcore/hydra/preprod'
```

#### Bảng tương thích phiên bản (Cardano Node)

| Hydra Version | cardano-node | cardano-cli |
| ------------- | ------------ | ----------- |
| **1.2.0**     | 10.5.3       | 10.11.0.0   |
| **1.1.0**     | —            | —           |
| **1.0.0**     | 10.4.1       | 10.8.0.0    |
| **0.21.0**    | 10.1.4       | 10.1.1.0    |

### Database, Docker, JWT, RabbitMQ (giống Phần A)

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true

NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'

JWT_SECRET=your_jwt_secret_key
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/
HUB_API_KEY=your_hub_api_key

MAX_ACTIVE_NODES=20
PORT=3010
LOG_DIR=logs

RABBITMQ_ENABLED=false
RABBITMQ_URI=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=provider.metrics
RABBITMQ_QUEUE=hexcore.queue
RABBITMQ_PREFETCH_COUNT=1
RABBITMQ_NO_ACK=false
RABBITMQ_QUEUE_DURABLE=true
```

> Xem giải thích chi tiết các biến RabbitMQ tại [A3.8](#a38-cấu-hình-rabbitmq). Các giá trị `RABBITMQ_URI`, `RABBITMQ_EXCHANGE`, `RABBITMQ_QUEUE` được cung cấp qua email khi provider được phê duyệt.

> **Lưu ý:** Tất cả đường dẫn trong `.env` **phải là đường dẫn tuyệt đối** vì chúng được dùng để mount vào Docker container.

---

## B5. Cách hệ thống hoạt động với Cardano Node

### 1) Query protocol parameters qua `cardano-cli`

Khi active Hydra Head, hệ thống chạy lệnh:

```bash
docker exec cardano-node cardano-cli query protocol-parameters \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

- `cardano-node` — tên container (= `NEST_CARDANO_NODE_SERVICE_NAME`)
- `/workspace/node.socket` — đường dẫn socket **bên trong** container (được mount từ `configs/cardano/` → `/workspace/`)
- `--testnet-magic 1` — Network Magic (1 = Preprod, 2 = Preview). Nếu `CARDANO_NETWORK='mainnet'`, dùng `--mainnet`.

### 2) Mount volume cho Hydra container

```text
Host (máy local)                              →  Hydra Container
────────────────────────────────────────────────────────────────
NEST_HYDRA_NODE_FOLDER   (/home/user/hydra)   →  /data
NEST_CARDANO_NODE_FOLDER (/home/user/cardano) →  /cardano-node
```

Hydra Node truy cập cardano-node socket qua `/cardano-node/node.socket`.

Các điều kiện cần đảm bảo:

- `NEST_CARDANO_NODE_FOLDER` trỏ đến thư mục chứa `node.socket` trên máy host
- File `node.socket` phải có quyền `777`

---

## B6. Khởi chạy MySQL

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

---

## B7. Phân quyền thư mục lưu trữ

```bash
# Thư mục logs
mkdir -p logs
chmod -R 755 logs

# Thư mục Hydra data (persistence và keys)
mkdir -p /home/user/hydra-hexcore/hydra/preprod
chmod -R 755 /home/user/hydra-hexcore/hydra/preprod

# Thư mục cardano-node (chứa config và node.socket)
chmod -R 777 /path/to/cardano-node/
chmod 777 /path/to/cardano-node/node.socket

# Thêm user vào group docker
sudo usermod -aG docker $USER
```

---

## B8. Chạy dự án

```bash
pnpm build
pnpm start:prod
```

- **API:** `http://localhost:3010`
- **Swagger:** `http://localhost:3010/api-docs`

---

## B9. Tạo tài khoản Admin & Đăng ký Provider

Sau khi server đã chạy và database đã sync, chạy lệnh sau để tạo admin và đăng ký provider lên Hydra Hub:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --logo-url=https://example.com/logo.png \
  --provider-url=https://example.com \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

**Giải thích các tham số:**

| Tham số              | Bắt buộc | Mô tả                                                             |
| -------------------- | -------- | ----------------------------------------------------------------- |
| `--username=`        | ✅       | Tên đăng nhập cho tài khoản admin                                 |
| `--password=`        | ✅       | Mật khẩu admin — tối thiểu **8 ký tự**, nên dùng mật khẩu mạnh    |
| `--ip=`              | ✅       | Địa chỉ IPv4 public của server (vd: `1.2.3.4`)                    |
| `--provider-name=`   | ✅       | Tên hiển thị của provider trên Hydra Hub                          |
| `--logo-url=`        | ❌       | URL ảnh logo của provider                                         |
| `--provider-url=`    | ❌       | URL website của provider/công ty                                  |
| `--connection-type=` | ✅       | Chế độ kết nối: `blockfrost` hoặc `cardano_node`                  |
| `--network=`         | ✅       | Mạng Cardano: `mainnet`, `preprod`, hoặc `preview`                |
| `--hexcore-url=`     | ✅       | Domain API công khai của provider (vd: `https://api.example.com`) |
| `--email=`           | ✅       | Email nhận **HUB API Key** — Hub sẽ gửi key về địa chỉ này        |

Khi chạy thành công, seeder sẽ:

1. Xóa toàn bộ user cũ và tạo tài khoản admin mới trong database
2. Tự động đăng nhập và lấy **Access Token**
3. Gửi thông tin lên **Hydra Hub** để đăng ký provider
4. Hub team phê duyệt xong → **HUB API Key** sẽ được gửi về email `--email=`

> **Về HUB API Key:** Đây là key dùng để xác thực các request từ Hub gửi về server của bạn. Sau khi nhận được, cập nhật vào `.env` với biến `HUB_API_KEY`.

Output mẫu khi chạy thành công:

```text
Starting create account admin seeder...
  ✓ Admin account created with username: admin
Access token: eyJhbGciOi...
ID: 1
Code: PRV-XXXX
Name: My Provider
Logo Url: https://example.com/logo.png
Url: https://example.com
Is Verified: false
IP: 1.2.3.4
Connection Type: cardano_node
Network: preprod
Domain: https://api.example.com
Access Token: eyJhbGciOi...
Webhook Key: whk_XXXX...
Email: contact@example.com
Process finished successfully.
```

> **Lưu ý:** Seeder sẽ **xóa toàn bộ user cũ** trước khi tạo admin mới. Đảm bảo `HYDRA_HUB_API_BASE_URL` đã được cấu hình đúng trong `.env`.

### B9.1. Cập nhật thông tin Provider

Nếu cần thay đổi thông tin provider (tên, URL, logo, ...), chạy lại lệnh seeder với các tham số mới. **Giữ nguyên `--ip=`** để hệ thống nhận diện đây là cập nhật provider hiện tại, không phải đăng ký mới:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_new_password \
  --ip=1.2.3.4 \
  --provider-name="My Updated Provider" \
  --logo-url=https://example.com/new-logo.png \
  --provider-url=https://example.com \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://api.example.com \
  --email=contact@example.com
```

> **Lưu ý:**
>
> - Nếu `--ip=` bị đổi khác với IP đang đăng ký, hệ thống sẽ xử lý như một **provider mới**.
> - Sau khi cập nhật, vẫn cần chờ Hub Team **xét duyệt lại**. Nếu được duyệt, HUB API Key và các cấu hình liên quan có thể được cập nhật và gửi lại qua email.

---

## Tổng hợp các bước nhanh (Cardano Node)

```bash
# 1. Cài đặt
pnpm install

# 2. Chạy Cardano Node (nếu chưa chạy)
cd configs/cardano && docker compose up -d && cd ../..
# Đợi sync xong: docker exec cardano-node cardano-cli query tip --socket-path /workspace/node.socket --testnet-magic 1

# 3. Phân quyền node.socket
chmod 777 /path/to/cardano/node.socket
chmod -R 777 /path/to/cardano/

# 4. Cấu hình .env
cp .env.example .env
# Chỉnh: CARDANO_CONNECTION_MODE=cardano-node + các biến NEST_CARDANO_NODE_*

# 5. Khởi chạy database
cd configs/mysql-databases && docker compose up -d && cd ../..

# 6. Phân quyền thư mục
mkdir -p logs && chmod -R 755 logs

# 7. Chạy server
pnpm build
pnpm start:prod

# 8. Tạo admin & đăng ký provider (mở terminal khác)
pnpm seed:run --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
  --username=admin \
  --password=your_password \
  --ip=1.2.3.4 \
  --provider-name="My Provider" \
  --connection-type=cardano_node \
  --network=preprod \
  --hexcore-url=https://your-domain.com \
  --email=contact@example.com
```

---

## Xử lý lỗi (Cardano Node)

| Lỗi                                                      | Nguyên nhân                                 | Cách khắc phục                                                      |
| -------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `connect ENOENT .../node.socket`                         | Cardano Node chưa chạy hoặc chưa phân quyền | Kiểm tra container đang chạy + `chmod 777 node.socket`              |
| `cardano-cli: Network.Socket.connect: permission denied` | `node.socket` chưa có quyền 777             | `chmod 777 /path/to/node.socket`                                    |
| `Failed to query protocol parameters`                    | Cardano Node chưa sync xong                 | Đợi sync xong, kiểm tra `docker logs cardano-node`                  |
| `OCI runtime exec failed: container_name not found`      | Tên container không đúng                    | Kiểm tra `NEST_CARDANO_NODE_SERVICE_NAME` khớp với `container_name` |
| `No such file or directory: /cardano-node/node.socket`   | `NEST_CARDANO_NODE_FOLDER` sai đường dẫn    | Kiểm tra đường dẫn tuyệt đối và file `node.socket` tồn tại          |
| `ECONNREFUSED 127.0.0.1:5672` (RabbitMQ)                 | RabbitMQ chưa chạy hoặc sai URI             | Kiểm tra RabbitMQ service và `RABBITMQ_URI` trong `.env`            |
