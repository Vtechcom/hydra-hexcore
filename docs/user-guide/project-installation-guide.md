# Hướng dẫn cài đặt & cấu hình hydra-hexcore (Dành cho hệ điều hành Linux)

## 1. Yêu cầu quan trọng nhất

- **Bạn phải tự cài đặt và chạy được cardano-node** (mainnet, preprod, preview...) trên máy hoặc server của bạn, đảm bảo node hoạt động bình thường và có file `node.socket`.
- **Docker & Docker Compose**: Đã cài đặt sẵn.
- **Node.js**: Yêu cầu phiên bản >= 20.x.
- **pnpm** (hoặc npm/yarn): Để cài package.

## 2. Cấu hình môi trường

### 2.1. Tạo file cấu hình

- Copy file mẫu `.env.example` thành `.env`:
  ```sh
  cp .env.example .env
  ```

### 2.2. Chỉnh sửa file `.env` (giải thích từng biến quan trọng)

- `NEST_HYDRA_NODE_FOLDER`: Thư mục dùng để lưu trữ các key được tạo ra khi chạy hydra-node. Bạn có thể tự quy định thư mục này, ví dụ: `/home/youruser/hydra-data` (nên để thư mục riêng, có quyền ghi).
- `NEST_HYDRA_NODE_SCRIPT_TX_ID`: Lấy giá trị phù hợp với môi trường từ trang release của hydra-node, ví dụ:  
  https://github.com/cardano-scaling/hydra-node/pkgs/container/hydra-node  
  hoặc tài liệu chính thức của Cardano/Hydra.  
  (Mỗi môi trường sẽ có script tx id khác nhau, KHÔNG dùng bừa).
- `NEST_HYDRA_NODE_NETWORK_ID`:  
  - 1: mainnet  
  - 0: preprod  
  - 2: preview  
  - ... (tùy môi trường bạn chạy node)
- `NEST_CARDANO_NODE_SERVICE_NAME`: Tên service cardano-node nếu bạn chạy bằng docker-compose (ví dụ: `cardano-node`). Nếu chạy node ngoài, có thể bỏ qua.
- `NEST_CARDANO_NODE_FOLDER`: Thư mục chứa file `node.socket` của cardano-node bạn đang chạy (ví dụ: `/home/youruser/cardano-node`).
- `NEST_CARDANO_NODE_SOCKET_PATH`: Đường dẫn tuyệt đối tới file `node.socket` (ví dụ: `/home/youruser/cardano-node/node.socket`).
- Các biến khác (DB, Redis, log...) chỉnh theo nhu cầu, giữ mặc định nếu dùng docker-compose của dự án.

## 3. Cấu hình docker-compose cho Ogmios, MySQL, Redis

### 3.1. Ogmios (Nếu muốn chạy Ogmios đã được cấu hình trong dự án)

- Vào `configs/ogmios/docker-compose.yml`, chỉnh sửa phần `volumes`:
  ```yaml
  volumes:
    - /duong/dan/den/cardano-node:/cardano-node
  ```
  (Thay `/duong/dan/den/cardano-node` bằng thư mục thật nơi bạn đang lưu `node.socket` và `config.json` của cardano-node).
- Đảm bảo command trong docker-compose đúng với vị trí file:
  ```yaml
  command:
    [
      "--node-socket", "/cardano-node/node.socket",
      "--node-config", "/cardano-node/config.json",
      "--host", "0.0.0.0"
    ]
  ```
- Đứng tại thư mục `configs/ogmios` và chạy:
  ```sh
  docker compose up -d
  ```

### 3.2. MySQL & Redis

- Vào `configs/mysql-databases-redis/docker-compose.yaml`, kiểm tra lại volume nếu muốn lưu data riêng.
- Đứng tại thư mục `configs/mysql-databases-redis` và chạy:
  ```sh
  docker compose up -d
  ```

## 4. Build & khởi động dự án

- Cài đặt package:
  ```sh
  pnpm install
  # hoặc npm install
  ```
- Build:
  ```sh
  pnpm run build
  # hoặc npm run build
  ```
- Start:
  ```sh
  pnpm start
  # hoặc npm start
  ```

## 5. Lưu ý & kiểm tra

- Đảm bảo các port không bị trùng.
- Đảm bảo quyền truy cập file/thư mục cho user chạy node và hydra-hexcore.
- API docs truy cập tại:  
  http://localhost:3010/api-docs (hoặc PORT bạn cấu hình trong .env)
- Nếu gặp lỗi kết nối node, ogmios, redis, mysql: kiểm tra lại đúng đường dẫn, host, port, quyền truy cập.

---

Nếu cần hướng dẫn chi tiết hơn về bất kỳ bước nào, hãy hỏi tiếp!
```

- Nếu bạn muốn chạy **toàn bộ dịch vụ phụ trợ bằng docker-compose của dự án** (bao gồm cardano-node, ogmios):

```sh
cd configs
docker compose up -d
```

## 4. Cài đặt & build mã nguồn

```sh
pnpm install
# hoặc npm install
pnpm run build
# hoặc npm run build
```

## 5. Khởi động dự án

```sh
pnpm start
# hoặc npm start
```

## 6. Kiểm tra hoạt động
- Truy cập các endpoint API hoặc swagger tại http://localhost:3010/api-docs (hoặc PORT bạn cấu hình).
- Kiểm tra log tại thư mục `logs/` hoặc terminal.

---

**Tóm tắt cấu hình node ngoài:**
- Nếu bạn có cardano-node hoặc ogmios chạy ngoài, chỉ cần chỉ đúng đường dẫn, host, port trong file `.env`.
- Không cần chạy docker-compose phần cardano-node/ogmios của dự án.
- Đảm bảo quyền truy cập file `node.socket` cho user chạy hydra-hexcore.

---

**Lưu ý:**
- Đảm bảo các port dịch vụ không bị trùng lặp trên máy.
- Nếu gặp lỗi quyền truy cập file hoặc thư mục, kiểm tra lại phân quyền.
- Tham khảo thêm tài liệu chi tiết trong `README.md`, `docs/`, hoặc liên hệ admin dự án nếu cần hỗ trợ.
