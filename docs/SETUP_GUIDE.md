# Hướng dẫn cài đặt và chạy Hydra Hexcore

Dự án hỗ trợ **2 chế độ kết nối** vào mạng Cardano:

|                 | Chế độ Blockfrost                | Chế độ Cardano Node                          |
| --------------- | -------------------------------- | -------------------------------------------- |
| **Độ khó**      | ⭐ Dễ — chỉ cần API key          | ⭐⭐⭐ Khó — phải tự chạy full node          |
| **Yêu cầu**     | Tài khoản Blockfrost             | Đã chạy thành công cardano-node              |
| **Ưu điểm**     | Nhanh, không cần sync blockchain | Không phụ thuộc bên thứ 3, chạy offline được |

> Chọn **một trong hai** chế độ và làm theo hướng dẫn tương ứng bên dưới.

---

# Phần A — Chạy bằng Blockfrost

## Yêu cầu hệ thống

- **Node.js** >= 20.x
- **pnpm** (khuyến nghị) — cài đặt: `npm install -g pnpm`
- **Docker** & **Docker Compose**
- **MySQL** 8.0+
- **Ubuntu** >= 20.x
- Tài khoản **Blockfrost** (lấy API key tại [https://blockfrost.io](https://blockfrost.io))

---

## 1. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

---

## 2. Cấu hình môi trường (.env)

Copy file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Mở file `.env` và chỉnh sửa các biến sau:

### 2.1. Cấu hình Blockfrost (chế độ kết nối Cardano)

```dotenv
# Chọn chế độ kết nối: blockfrost hoặc cardano-node
CARDANO_CONNECTION_MODE=blockfrost

# Lấy Project ID từ https://blockfrost.io/dashboard
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Base URL cho Blockfrost API (preprod / mainnet)
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
```

> **Lưu ý:** Đăng ký tài khoản Blockfrost miễn phí tại [blockfrost.io](https://blockfrost.io), tạo project trên mạng **Preprod** và lấy **Project ID**.

### 2.2. Cấu hình Hydra Node

```dotenv
# testnet hoặc mainnet
# Nếu là testnet → hệ thống sẽ dùng --testnet-magic <NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID>
# Nếu là mainnet → hệ thống sẽ dùng --mainnet (bỏ qua NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID)
CARDANO_NETWORK='testnet'

NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### Cách lấy `NEST_HYDRA_NODE_IMAGE` (Docker Image)

Chọn phiên bản Hydra Node tại: [https://github.com/cardano-scaling/hydra/releases](https://github.com/cardano-scaling/hydra/releases)

Format: `ghcr.io/cardano-scaling/hydra-node:<version>`

Ví dụ:

```
ghcr.io/cardano-scaling/hydra-node:1.2.0   # Phiên bản mới nhất (khuyến nghị)
ghcr.io/cardano-scaling/hydra-node:1.1.0
ghcr.io/cardano-scaling/hydra-node:1.0.0
ghcr.io/cardano-scaling/hydra-node:0.21.0
```

> **Lưu ý:** Lấy theo version thì sẽ chỉnh sửa biến môi trường NEST_HYDRA_NODE_IMAGE đúng với version bạn chọn.

#### Cách lấy `NEST_HYDRA_NODE_SCRIPT_TX_ID`

Mỗi phiên bản Hydra Node đều publish sẵn **Script TX IDs** cho từng mạng (preview, preprod, mainnet). Bạn cần lấy đúng TX ID tương ứng với **phiên bản Hydra Node** và **mạng Cardano** đang sử dụng.

**Bước 1:** Truy cập trang release của phiên bản đã chọn:

```
https://github.com/cardano-scaling/hydra/releases/tag/<version>
```

**Bước 2:** Tìm mục **"Hydra Scripts"** trong trang release, lấy giá trị TX IDs tương ứng với mạng bạn đang dùng (`preview`, `preprod`, hoặc `mainnet`).

**Bước 3:** Hoặc truy cập trực tiếp file `networks.json` của phiên bản đó:

```
https://raw.githubusercontent.com/cardano-scaling/hydra/<version>/hydra-node/networks.json
```

Dưới đây là bảng Script TX IDs cho một số phiên bản phổ biến:

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

> **Quan trọng:** Script TX IDs **phải khớp** với phiên bản Docker Image (`NEST_HYDRA_NODE_IMAGE`). Nếu dùng image `1.2.0` thì phải dùng TX IDs của phiên bản `1.2.0`.

#### Cách chọn `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`

| Mạng                  | `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID` |
| --------------------- | --------------------------------------- |
| **Preview** (testnet) | `2`                                     |
| **Preprod** (testnet) | `1`                                     |
| **Mainnet**           | Không cần (dùng `CARDANO_NETWORK='mainnet'`) |

> **Lưu ý:** Khi `CARDANO_NETWORK='mainnet'`, hệ thống tự động dùng `--mainnet` và **bỏ qua** `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`.

Ví dụ cấu hình cho **Preprod**:

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/path/to/hydra/preprod'
```

#### Bảng tương thích phiên bản

| Hydra Version | cardano-node | cardano-cli | Docker Image Tag |
| ------------- | ------------ | ----------- | ---------------- |
| **1.2.0**     | 10.5.3       | 10.11.0.0   | `1.2.0`          |
| **1.1.0**     | —            | —           | `1.1.0`          |
| **1.0.0**     | 10.4.1       | 10.8.0.0    | `1.0.0`          |
| **0.21.0**    | 10.1.4       | 10.1.1.0    | `0.21.0`         |

### 2.3. Cấu hình Database (MySQL)

```dotenv
DB_HOST=localhost
DB_PORT=3309
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore
DB_SYNCHRONIZE=true
```

### 2.4. Cấu hình Docker

```dotenv
# Linux / macOS
NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'

NEST_DOCKER_ENABLE_NETWORK_HOST='false'
```

### 2.5. Cấu hình JWT & Hydra Hub

```dotenv
# Secret key phục vụ cho tạo accessToken phục vụ cho việc xác thực
JWT_SECRET=your_jwt_secret_key
# Các thông tin dưới cần liên hệ với bên Hub để được cấp thông tin
HYDRA_HUB_API_BASE_URL=https://api.hydrahub.io
HUB_API_KEY=your_hub_api_key
```

### 2.6. Giới hạn & Cấu hình khác

```dotenv
# Số lượng node tối đa có thể active cùng lúc
MAX_ACTIVE_NODES=20
```

### 2.7. Port & Log

```dotenv
PORT=3010
LOG_DIR=logs
```

---

## 3. Khởi chạy MySQL bằng Docker Compose

Dự án đã cung cấp sẵn file Docker Compose cho MySQL:

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..  
```

Sau khi khởi chạy:

| Service | Host      | Port | Username     | Password         |
| ------- | --------- | ---- | ------------ | ---------------- |
| MySQL   | localhost | 3327 | hexcore_user | hexcore_password |

> Cập nhật file `.env` cho đúng port nếu dùng Docker Compose mặc định:
>
> ```dotenv
> DB_PORT=3327
> DB_PASSWORD=hexcore_password
> ```

---

## 4. Phân quyền thư mục lưu trữ

Đảm bảo các thư mục lưu trữ dữ liệu Hydra Node có quyền ghi:

```bash
# Tạo thư mục logs nếu chưa có
mkdir -p logs

# Tạo thư mục lưu trữ Hydra Node data (Nó là thư mục để lưu persistence và các key sử dụng trong hydra node)
mkdir -p /path/to/hydra/.../

# Phân quyền cho thư mục Hydra Node
chmod -R 755 /path/to/hydra/.../

# Phân quyền cho thư mục logs
chmod -R 755 logs

# Đảm bảo Docker socket có thể truy cập
# (Linux) Thêm user hiện tại vào group docker nếu chưa có
sudo usermod -aG docker $USER
```

> **Quan trọng:** Thay `/path/to/hydra/.../` bằng đường dẫn thực tế bạn đã cấu hình trong `NEST_HYDRA_NODE_FOLDER` ở file `.env`.

---

## 5. Chạy dự án
```bash
# Build production
pnpm build

# Chạy production
pnpm start:prod
```

Server sẽ khởi chạy tại:

- **API:** `http://localhost:3010`
- **Swagger docs:** `http://localhost:3010/api-docs`


---

## 6. Tạo tài khoản Admin & Đăng ký Provider

Sau khi server chạy thành công và database đã được sync, chạy lệnh sau để tại tài khoản admin và đăng ký provider:

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin.seeder.ts --username=admin --password=your_password
```

**Giải thích:**

- `--username=admin` — tên đăng nhập cho tài khoản admin
- `--password=your_password` — mật khẩu cho tài khoản admin (thay bằng mật khẩu mạnh)

Khi chạy thành công, sẽ:

1. Tạo tài khoản admin trong database
2. Tự động đăng nhập và lấy **Access Token**
3. Gửi Access Token lên **Hydra Hub** để đăng ký provider

Output mẫu:

```
Starting create account admin seeder...
  ✓ Admin account created with username: admin, password: ****
Access token: eyJhbGciOi...
ID: 1
Code: PRV-XXXX
Name: Provider Name
Is Verified: false
Network: preprod
Webhook Key: whk_XXXX...
Process finished successfully.
```

> **Lưu ý:** Seeder sẽ xóa toàn bộ user cũ trước khi tạo admin mới. Đảm bảo đã cấu hình `HYDRA_HUB_API_BASE_URL` và `HUB_API_KEY` trong `.env` để việc đăng ký provider lên Hub thành công. (Liên hệ với bên quản lý Hub để được cấp thông tin của `HYDRA_HUB_API_BASE_URL` và `HUB_API_KEY`)

---

## 7. Sử dụng API (Lựa chọn này có thể thực hiện hoặc không)

Sau khi tạo tài khoản admin, bạn có thể:

1. Truy cập Swagger UI tại `http://localhost:3010/api-docs`
2. Đăng nhập với tài khoản admin để lấy JWT token
3. Sử dụng token để gọi các API quản lý Hydra Head

---

## Tổng hợp các bước nhanh

```bash
# 1. Cài đặt
pnpm install

# 2. Cấu hình
cp .env.example .env
# Sửa .env theo hướng dẫn ở trên

# 3. Khởi chạy database
cd configs/mysql-databases && docker compose up -d && cd ../..

# 4. Phân quyền
mkdir -p logs
chmod -R 755 logs

# 5. Chạy project
pnpm build
pnpm start:prod

# 6. Tạo admin & đăng ký provider (terminal khác)
pnpm seed:run --path=src/migrations/seeders/create-account-admin.seeder.ts --username=admin --password=your_password
```

---

## Xử lý lỗi thường gặp

| Lỗi                                                          | Nguyên nhân                                        | Cách khắc phục                                                                |
| ------------------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| `BlockFrost API configuration is missing`                    | Chưa cấu hình Blockfrost                           | Kiểm tra `BLOCKFROST_PROJECT_ID` trong `.env`                                 |
| `ECONNREFUSED 127.0.0.1:3309`                                | MySQL chưa chạy                                    | Chạy `docker compose up -d` trong `configs/mysql-databases`             |
| `EACCES: permission denied`                                  | Không có quyền ghi thư mục                         | Chạy `chmod -R 755` cho thư mục tương ứng                                     |
| `connect ENOENT /var/run/docker.sock`                        | Docker daemon chưa chạy                            | Khởi động Docker service                                                      |
| `connect ENOENT .../node.socket`                             | Cardano Node chưa chạy hoặc chưa phân quyền socket | Kiểm tra cardano-node container đang chạy, chạy `chmod 777 node.socket`       |
| `cardano-cli: Network.Socket.connect: ... permission denied` | `node.socket` chưa được phân quyền 777             | `chmod 777 /path/to/cardano-node/node.socket`                                 |
| `Failed to query protocol parameters`                        | Cardano Node chưa sync xong                        | Đợi cardano-node đồng bộ xong blockchain, kiểm tra `docker logs cardano-node` |

---

---

# Phần B — Chạy bằng Cardano Node

> ⚠️ **Điều kiện tiên quyết:** Bạn phải **đã có kinh nghiệm** cài đặt và chạy thành công Cardano Node. Nếu chưa có kinh nghiệm, hãy làm theo **Phần A** (Blockfrost) ở trên.

## B1. Cài đặt dependencies

```bash
git clone <repository-url>
cd hydra-hexcore
pnpm install
```

## B2. Chạy Cardano Node
Cardano Node:

- **Tên container** (hoặc cách truy cập `cardano-cli`)
- **Đường dẫn thư mục** chứa `node.socket`, `shelley-genesis.json` trên máy host
- **Đường dẫn `node.socket`** bên trong container

> **Quan trọng:** Phải đợi cardano-node **đồng bộ xong blockchain** trước khi tiếp tục. Quá trình sync có thể mất **vài giờ đến vài ngày** tuỳ mạng (preprod nhanh hơn mainnet).
>
> ```bash
> # Theo dõi tiến trình sync
> docker logs -f cardano-node
> ```

### Kiểm tra cardano-node đã sync xong

```bash
docker exec cardano-node cardano-cli query tip \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

Nếu trả về JSON có `syncProgress: "100.00"` nghĩa là đã sync xong.

## B3. Phân quyền cho `node.socket` và thư mục Cardano Node

**Bắt buộc** phân quyền `777` để Hydra Node container có thể truy cập socket:

```bash
# Phân quyền cho node.socket (BẮT BUỘC)
chmod 777 /path/to/cardano-node/node.socket

# Phân quyền cho toàn bộ thư mục cardano-node
chmod -R 777 /path/to/cardano-node/
```

Ví dụ nếu dùng Docker Compose mặc định của dự án:

```bash
chmod 777 configs/cardano/node.socket
chmod -R 777 configs/cardano/
```

> ⚠️ **Nếu không phân quyền**, Hydra Node sẽ báo lỗi `permission denied` hoặc `ENOENT node.socket` khi active head.

## B4. Cấu hình `.env`

```bash
cp .env.example .env
```

Chỉnh sửa các biến sau:

### Chế độ kết nối → `cardano-node`

```dotenv
CARDANO_CONNECTION_MODE=cardano-node

# testnet hoặc mainnet
# Nếu là testnet → hệ thống sẽ dùng --testnet-magic <NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID>
# Nếu là mainnet → hệ thống sẽ dùng --mainnet (bỏ qua NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID)
CARDANO_NETWORK='testnet'
```

### Cấu hình Cardano Node

```dotenv
# Tên container cardano-node (phải trùng với container_name trong docker-compose)
NEST_CARDANO_NODE_SERVICE_NAME='cardano-node'

# Image cardano-node (chọn phiên bản tương thích với Hydra, xem bảng tương thích bên dưới)
NEST_CARDANO_NODE_IMAGE='ghcr.io/intersectmbo/cardano-node:10.2.1'

# Đường dẫn TUYỆT ĐỐI đến thư mục chứa file cấu hình cardano-node trên máy host
# (chứa node.socket, shelley-genesis.json, config.json, ...)
# Thư mục này sẽ được mount vào /cardano-node trong Hydra container
NEST_CARDANO_NODE_FOLDER='/home/user/hydra-hexcore/configs/cardano'

# Đường dẫn TUYỆT ĐỐI đến node.socket trên máy host
NEST_CARDANO_NODE_SOCKET_PATH='/home/user/hydra-hexcore/configs/cardano/node.socket'
```

### Cấu hình Hydra Node

Xem hướng dẫn chi tiết cách lấy Script TX ID, Network ID ở [mục 2.2 Phần A](#22-cấu-hình-hydra-node).

```dotenv
NEST_HYDRA_NODE_IMAGE='ghcr.io/cardano-scaling/hydra-node:1.2.0'
NEST_HYDRA_NODE_SCRIPT_TX_ID='ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3'
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID='1'
NEST_HYDRA_NODE_FOLDER='/home/user/hydra-hexcore/hydra/preprod'
```

### Database, Docker, JWT, Log (giống Phần A)

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore
DB_SYNCHRONIZE=true

NEST_DOCKER_SOCKET_PATH='/var/run/docker.sock'
NEST_DOCKER_ENABLE_NETWORK_HOST='false'

JWT_SECRET=your_jwt_secret_key #(Khóa bí mật để tạo accessToken phục vụ cho việc xác thực)
HYDRA_HUB_API_BASE_URL=https://api.hydrahub.io #(Liên hệ với Hub để có thể cấp thông tin)
HUB_API_KEY=your_hub_api_key #(Liên hệ với Hub để có thể cấp thông tin)

ACCOUNT_MIN_LOVELACE=50000000
MAX_ACTIVE_NODES=20

NEST_OGMIOS_HOST=localhost
NEST_OGMIOS_PORT=1337

PORT=3010
LOG_DIR=logs
```

> **Lưu ý:** Tất cả đường dẫn trong `.env` **phải là đường dẫn tuyệt đối** (absolute path) vì chúng được dùng để mount vào Docker container. Thay `/home/user/hydra-hexcore/` bằng đường dẫn thực tế trên máy bạn.

## B5. Hiểu cách hệ thống hoạt động với Cardano Node

Khi active một Hydra Head, hệ thống thực hiện 2 việc liên quan đến cardano-node:

### 1) Query protocol parameters qua `cardano-cli`

Hệ thống chạy lệnh sau để lấy protocol parameters từ cardano-node:

```bash
docker exec cardano-node cardano-cli query protocol-parameters \
    --socket-path /workspace/node.socket \
    --testnet-magic 1
```

Trong đó:

- `cardano-node` — tên container (= `NEST_CARDANO_NODE_SERVICE_NAME`)
- `/workspace/node.socket` — đường dẫn socket **bên trong container cardano-node** (được mount từ `configs/cardano/` → `/workspace/` theo docker-compose)
- `--testnet-magic 1` — Network Magic Number (= `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`: 1 = Preprod, 2 = Preview). Nếu `CARDANO_NETWORK='mainnet'`, hệ thống sẽ dùng `--mainnet` thay thế.

> Nếu bạn chạy cardano-node của riêng mình (không dùng docker-compose mặc định), cần đảm bảo đường dẫn socket và tên container trong source code khớp với cấu hình của bạn. Hiện tại các giá trị này đang hardcode trong source (xem `hydra-heads.service.ts` dòng 256-271).

### 2) Mount volume cho Hydra container

Khi tạo Docker container cho Hydra Node:

```
Host (máy local)                                             →  Hydra Container
──────────────────────────────────────────────────────────────────────────────────
NEST_HYDRA_NODE_FOLDER   (vd: /home/user/hydra/preprod)      →  /data
NEST_CARDANO_NODE_FOLDER (vd: /home/user/configs/cardano)    →  /cardano-node
```

Hydra Node trong container sẽ truy cập vào cardano-node socket qua `/cardano-node/node.socket`.

Vì vậy:

- `NEST_CARDANO_NODE_FOLDER` phải trỏ đến thư mục chứa `node.socket` trên máy host
- File `node.socket` trong thư mục đó phải có quyền `777`

### Bảng tương thích phiên bản

| Hydra Version | cardano-node | cardano-cli | Docker Image Tag |
| ------------- | ------------ | ----------- | ---------------- |
| **1.2.0**     | 10.5.3       | 10.11.0.0   | `1.2.0`          |
| **1.1.0**     | —            | —           | `1.1.0`          |
| **1.0.0**     | 10.4.1       | 10.8.0.0    | `1.0.0`          |
| **0.21.0**    | 10.1.4       | 10.1.1.0    | `0.21.0`         |

## B6. Khởi chạy MySQL

```bash
cd configs/mysql-databases
docker compose up -d
cd ../..
```

## B7. Phân quyền thư mục lưu trữ

```bash
mkdir -p logs
chmod -R 755 logs

# Tạo thư mục Hydra data (Thư mục lưu thông tin persistence và key sử dụng trong hydra node)
mkdir -p /home/user/hydra-hexcore/hydra/preprod
chmod -R 755 /home/user/hydra-hexcore/hydra/preprod

# Phân quyền thư mục cardano (bao gồm node.socket)
chmod -R 777 /path/user/... (Thư mục lưu các file cấu hình của cardano khi chạy docker compose)
chmod 777 /path/user/.../cardano/node.socket (Đường dẫn lưu file node.socket khi chạy cardano)

sudo usermod -aG docker $USER
```

## B8. Chạy dự án

```bash
pnpm build
pnpm start:dev
```

- **API:** `http://localhost:3010`
- **Swagger docs:** `http://localhost:3010/api-docs`

## B9. Tạo tài khoản Admin & Đăng ký Provider

```bash
pnpm seed:run --path=src/migrations/seeders/create-account-admin.seeder.ts --username=admin --password=your_password
```

Seeder sẽ:

1. Tạo tài khoản admin trong database
2. Tự động đăng nhập và lấy **Access Token**
3. Gửi Access Token lên **Hydra Hub** để đăng ký provider

---

## Tổng hợp các bước nhanh (Cardano Node)

```bash
# 1. Cài đặt
pnpm install

# 2. Chạy Cardano Node (nếu chưa chạy)
cd configs/cardano && docker compose up -d && cd ../..
# Đợi sync xong! Kiểm tra: docker exec cardano-node cardano-cli query tip --socket-path /workspace/node.socket --testnet-magic 1

# 3. Phân quyền node.socket
chmod 777 /path/cardano/node.socket
chmod -R 777 /path/cardano/...

# 4. Cấu hình
cp .env.example .env
# Sửa .env: CARDANO_CONNECTION_MODE=cardano-node + các biến NEST_CARDANO_NODE_*

# 5. Khởi chạy MySQL
cd configs/mysql-databases && docker compose up -d && cd ../..

# 6. Phân quyền thư mục
mkdir -p logs && chmod -R 755 logs

# 7. Chạy project
pnpm build
pnpm start:prod

# 8. Tạo admin & đăng ký provider (terminal khác)
pnpm seed:run --path=src/migrations/seeders/create-account-admin.seeder.ts --username=admin --password=your_password
```

---

## Xử lý lỗi (Cardano Node)

| Lỗi                                                              | Nguyên nhân                                 | Cách khắc phục                                                      |
| ---------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `connect ENOENT .../node.socket`                                 | Cardano Node chưa chạy hoặc chưa phân quyền | Kiểm tra container đang chạy + `chmod 777 node.socket`              |
| `cardano-cli: Network.Socket.connect: permission denied`         | `node.socket` chưa có quyền 777             | `chmod 777 /path/to/node.socket`                                    |
| `Failed to query protocol parameters`                            | Cardano Node chưa sync xong                 | Đợi sync xong, kiểm tra `docker logs cardano-node`                  |
| `OCI runtime exec failed: exec failed: container_name not found` | Tên container không đúng                    | Kiểm tra `NEST_CARDANO_NODE_SERVICE_NAME` khớp với `container_name` |
| `No such file or directory: /cardano-node/node.socket`           | `NEST_CARDANO_NODE_FOLDER` sai đường dẫn    | Kiểm tra đường dẫn tuyệt đối và file `node.socket` tồn tại          |
