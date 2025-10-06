# **Hexcore-UI — Admin User Guide**

> **Version**: 1.0.1
>
> **Date:** October 6, 2025 at 11:59 AM  
>
> **Authors:** Aniadev
>
> **Scope:** Admin guide


---

## 1. Giới thiệu

**Hexcore-UI** là giao diện quản trị dành cho **Hydra Node Cluster**, giúp người dùng dễ dàng:

* Quản lý các Hydra Node và Head trên Cardano Hydra Layer-2.
* Giám sát trạng thái ví, tài khoản và tài nguyên node.
* Thực hiện thao tác nhanh như **Start / Stop / Restart / Erase Persistence**.
* Theo dõi tiến trình hoạt động và trạng thái kết nối của từng node.

> ⚡ Mục tiêu: Giảm thao tác CLI phức tạp → Tăng hiệu suất DevOps khi vận hành Hydra cluster.


---

## 2. Kiến trúc tổng thể

Hệ thống **Hexcore** được thiết kế theo mô hình **modular architecture**, tách biệt rõ giữa **lớp giao diện quản trị**, **lớp điều phối backend**, và **lớp hạ tầng container Hydra Node**.

Mục tiêu của kiến trúc này là giúp người quản trị có thể **vận hành, theo dõi và điều khiển** các cụm **Hydra Nodes** một cách dễ dàng, thông qua giao diện trực quan mà không cần thao tác thủ công trên CLI.

### 1. Tổng quan

```typescript
+-------------------------------------------------------------+
|                         HEXCORE UI                          |
|          (Frontend for Hydra Node & Head Management)        |
+-------------------------------------------------------------+
                             │
                             ▼
+-------------------------------------------------------------+
|                        HEXCORE SYSTEM                       |
|                                                             |
|  +----------------------+   +----------------------------+  |
|  |  API Server          |   |  Node Management Service   |  |
|  |  (NestJS / Fastify)  |   |  (NestJS + Dockerode)      |  |
|  |----------------------|   |----------------------------|  |
|  | - Giao tiếp với UI   |   | - Điều khiển container     |  |
|  | - Cung cấp REST/WS   |   | - Quản lý vòng đời node    |  |
|  | - Ủy quyền tới Agent |   | - Theo dõi trạng thái      |  |
|  +----------------------+   +----------------------------+  |
|             │                         │                     |
|             ▼                         ▼                     |
|  +----------------------+   +----------------------------+  |
|  |  Redis / PostgreSQL  |   |  Wallet Service            |  |
|  |----------------------|   |----------------------------|  |
|  | - Lưu trạng thái node|   | - Quản lý key, ví, address |  |
|  | - Cache / job queue  |   | - Kết nối Cardano wallet   |  |
|  +----------------------+   +----------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  |  Setup Tool (planned)                                 |  |
|  |-------------------------------------------------------|  |
|  | - CLI/Script cài đặt Hexcore                          |  |
|  | - Setup môi trường: Docker, Cardano-node, proxy, ...  |  |
|  | - Phân quyền và khởi tạo thư mục persistence          |  |
|  | - Tự động khởi tạo container và cấu hình mạng Hydra   |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

### **2. Hexcore UI**

* **Vai trò:** Giao diện web dành cho **người quản trị Hydra cluster**.
* **Công nghệ:** Vue 3 + TailwindCSS + Shadcn UI.
* **Chức năng:**
  * Theo dõi trạng thái node & head.
  * Kết nối WebSocket monitor.
  * Thao tác Activate / Deactivate / Clear Persistence.
  * Quản lý ví và tài nguyên.

### **3. Hexcore System**

#### 1. API Server

* **Chức năng:** Lớp trung gian giao tiếp giữa giao diện và backend hệ thống.
* **Công nghệ:** NestJS Framework.
* **Vai trò:**
  * Nhận yêu cầu từ UI → phân phối tới các dịch vụ nội bộ.
  * Giao tiếp qua REST hoặc WebSocket.
  * Quản lý xác thực, phân quyền, và thông tin session.

#### 2. Node Management Service

* **Chức năng:** Quản lý và điều khiển **Hydra Node containers**.
* **Công nghệ:** NestJS + Dockerode.
* **Vai trò:**
  * Khởi tạo, dừng, xóa node container.
  * Theo dõi logs, trạng thái và metrics của node.
  * Tương tác trực tiếp với Docker Engine qua API.

#### 3. Redis / PostgreSQL

* **Redis:**
  * Dùng làm cache và hàng đợi xử lý (event queue).
  * Lưu trữ tạm trạng thái WebSocket và phiên hoạt động.
* **PostgreSQL:**
  * Lưu dữ liệu cấu hình node, lịch sử thao tác, logs, và wallet state.
  * Quản lý quan hệ giữa node ↔ head.

#### 4. Wallet Service

* **Chức năng:** Quản lý tài khoản và khóa ký của các node.
* **Vai trò:**
  * Lưu trữ thông tin `vkey`, `skey`, `addr` cho từng node.
  * Đồng bộ trạng thái ví từ Cardano-node hoặc wallet SDK.
  * Đảm bảo mỗi node container được gắn đúng ví điều hành.

#### 5. Setup Tool *(Dự kiến phát triển)*

* **Mục tiêu:** Đơn giản hóa việc cài đặt và cấu hình hệ thống Hexcore.
* **Dạng:** CLI hoặc script tự động.
* **Chức năng chính:**
  * Cài đặt dependencies: Docker, Docker Compose, Cardano-node, ogmios.
  * Tạo thư mục và phân quyền cần thiết (`/data/persistence`, `/logs`, …).
  * Cấu hình proxy, port, environment variables.
  * Tự động bootstrap các dịch vụ Hexcore (API, Redis, Postgres, Agent, UI).

### 💡 Tổng kết

| Thành phần | Chức năng | Công nghệ |
|----|----|----|
| **Hexcore UI** | Giao diện quản trị | Nuxt 3, Tailwind, Shadcn |
| **API Server** | Trung gian giao tiếp | NestJS |
| **Node Management** | Điều khiển container | NestJS, Dockerode, Ogmios |
| **Redis / PostgreSQL** | Lưu trạng thái & dữ liệu | Redis, Postgres |
| **Wallet Service** | Quản lý ví & khóa | Cardano SDK |
| **Setup Tool** *(planned)* | Cài đặt & cấu hình nhanh | Node CLI / Bash |


---

## 3. Đăng nhập hệ thống

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=798b2b1d-69ea-407b-8aef-924461cde65e " =2880x1508")

* Truy cập: **https://ui.hexcore.io.vn/**
* Nhập **username / password** do admin cấp.
* Sau khi đăng nhập, hệ thống chuyển hướng đến **Dashboard**.

> 🔐 Lưu ý: Admin có thể bật xác thực JWT hoặc OAuth trong bản nâng cao.


---

## 4. Dashboard — Tổng quan hệ thống

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=73b67022-f536-4092-88c4-0744a8b33594 " =2880x1508")


Dashboard hiển thị:

| Thành phần | Mô tả |
|----|----|
| **Hydra Nodes** | Tổng số node đang hoạt động |
| **Active Heads** | Số lượng head đang mở |
| **Wallet Status** | Số dư ADA, token đang quản lý |
| **Logs Summary** | Các sự kiện gần đây: started, stopped, errors |
| **Quick Actions** | Nút tạo node mới, refresh, restart tất cả |

> 💡 Gợi ý: Mỗi node nên có **prefix** và **owner tag** để dễ quản lý khi chạy nhiều instance.


---

## 5. Wallet Accounts

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=ab492913-2188-4673-af8f-2bc5d2b40748 " =2880x1508")


Tại đây bạn có thể:

* Xem danh sách **ví đang kết nối** (hot wallet / test wallet).
* Kiểm tra số dư, địa chỉ và key hash.
* Đồng bộ ví với **Cardano testnet** hoặc **Hydra-compatible wallet**.
* Thực hiện nạp (fund) ADA để chạy node test.


---

## 6. Quản lý Hydra Nodes

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=5e60e044-0495-4408-a0bf-6d86c4d2829c " =1440x685")

Danh sách tất cả các **Hydra Node containers** đã được tạo, mỗi node hiển thị:

| Cột | Mô tả |
|----|----|
| **Port** | Cổng REST/WebSocket đang mở |
| **Endpoint** | Đường dẫn WebSocket để theo dõi node |
| **Status** | Active / Inactive |
| **Description** | Metadata mô tả node |
| **Address (addr / vkey)** | Thông tin ví vận hành node |

> ⚠️ **Lưu ý:** Phiên bản hiện tại (v1.0.1) **chưa hỗ trợ thao tác trực tiếp Start/Stop/Restart node**.
> Các hành động điều khiển node được thực hiện **thông qua thao tác với Hydra Head** (phần dưới).


---

### 1. Mở **Monitor**

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=e4f2c85b-9a28-4728-acdb-e422796ce6a9 " =684x435")

* Chức năng: **kết nối WebSocket** trực tiếp tới node để theo dõi **log sự kiện realtime**.
* Mỗi sự kiện hiển thị:
  * **Sequence** (số thứ tự)
  * **Tag** (loại sự kiện: `Greetings`, `TxValid`, `SnapshotConfirmed`, `DecommitFinalized`, …)
  * **Timestamp** (thời gian ghi nhận)
* Ngoài ra, phía trên có các chỉ số tổng hợp:

| Thông số | Ý nghĩa |
|----|----|
| Sequence | Số sự kiện hiện tại |
| Total Tx | Tổng số giao dịch xử lý |
| Total commit amount | Tổng ADA commit |
| Head opened count | Số head đang mở |
| Peer disconnected count | Node rời cụm |
| Latency | Độ trễ WebSocket (ms) |
* Bên trái là danh sách **commands khả dụng**:
  * `Init`, `Abort`, `GetUTxO`, `NewTx`, `Fanout`
  * Có thể gửi payload tùy chọn qua ô “Payload”


---

### 2. Xem **vkey** và thông tin ví

* Hiển thị public key (`vkey`) và địa chỉ ví (`addr_...`) của node.
* Dữ liệu này được đồng bộ từ Cardano wallet service tích hợp.
* Giúp admin xác minh node đang vận hành với ví nào.


---

## 7. Quản lý Hydra Heads

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=2a560cd0-2e2b-49d1-b393-8c7d7c36d3e4 " =1440x755")

Tại đây admin có thể thực hiện **các thao tác điều khiển head**, bao gồm toàn bộ các node nằm trong cụm head đó.

### 1. Các thao tác khả dụng:

| Hành động | Mô tả |
|----|----|
| 🟢 **Activate** | Khởi động toàn bộ **node containers** thuộc head này |
| 🔴 **Deactivate** | Dừng toàn bộ containers |
| 🧹 **Clear Persistences** | Xóa toàn bộ thư mục persistence của các node trong head |
| 🧩 **Monitor** | Mở bảng giám sát WebSocket (xem luồng log node trong head) |
| 💬 **Commands** | Gửi lệnh trực tiếp (`Init`, `Abort`, `GetUTxO`, `NewTx`, …) tới các node trong head |

> 💡 Khi **Activate**, hệ thống gọi Hexcore Agent để start tất cả node containers được định danh trong head.

### 2. Xem thông số chi tiết của head

 ![](https://wiki.ada-defi.io.vn/api/attachments.redirect?id=d270daf1-0ef0-4bde-9590-c61e09b7ce3c " =1220x497")

Các tabs:

* Visualize hydra nodes
* View port map
* View head detail


---

## 8. Best Practices

| Tình huống | Khuyến nghị |
|----|----|
| Nhiều node chạy cùng lúc | Gán tên và port riêng cho từng node |
| Reset cluster | Sử dụng “Erase Persistence” để tránh xung đột dữ liệu |
| Theo dõi lỗi | Mở tab Logs, kết hợp với `docker logs` |
| Bảo mật | Không chia sẻ file `persistence` hoặc ví trên public server |


---

## 9. Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|----|----|----|
| Node không khởi động | Port bị trùng hoặc thiếu wallet | Kiểm tra port và ví |
| Không tạo được Head | Chưa đủ participant | Đảm bảo đủ node online |
| Wallet không hiện số dư | Sync lỗi | Refresh hoặc nạp ADA testnet |
| Logs không hiển thị | Kết nối Redis lỗi | Kiểm tra redis-server |


---

## 11. FAQ

**Q:** Làm sao để reset toàn bộ cluster?
**A:** Dừng tất cả node → chọn “Erase Persistence” → Start lại từng node.

**Q:** Có thể dùng Hexcore-UI cho mainnet?
**A:** Có thể, nhưng cần cấu hình `CARDANO_NETWORK=mainnet` và sử dụng ví cứng để bảo mật.

**Q:** Tôi có thể thêm người dùng khác?
**A:** Admin có thể cấp tài khoản trong phần “User Settings” (roadmap feature).

