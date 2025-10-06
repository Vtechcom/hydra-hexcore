## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này mô tả yêu cầu phần mềm cho hệ thống **Hexcore**, một nền tảng quản lý và triển khai **Hydra Node** trên mạng Cardano.
Hexcore cung cấp:

* **UI Web** cho admin quản lý node.
* **Backend NestJS** để quản lý tài khoản, điều khiển Docker container chạy Hydra node, lưu trữ thông tin vào **PostgreSQL**.
* Hỗ trợ khởi tạo, bật/tắt node, tùy chỉnh cấu hình, ghép node thành Hydra Head.

### 1.2 Phạm vi hệ thống

Hexcore cho phép:

* Tạo và quản lý nhiều Hydra node chạy trong container.
* Quản lý tài khoản admin và wallet accounts dùng để vận hành node.
* Cấu hình node (tham số Hydra, cổng mạng, tham gia head).
* Ghép nhiều node thành **Hydra Head** và chạy chúng theo yêu cầu.

### 1.3 Đối tượng sử dụng

* **Admin**: người quản lý toàn bộ hệ thống Hydra node.
* **Developer**: tích hợp Hexcore với SDK/dApps khác (qua API).

### 1.4 Tài liệu tham khảo

* Cardano Hydra Protocol Specification
* Docker Engine API
* PostgreSQL Documentation
* Hexcore – Hydra Manager (nội bộ)
* Hexcore – Chi tiết dự án (nội bộ)


---

## 2. Mô tả tổng quan

### 2.1 Môi trường hoạt động

* **Frontend (Hexcore UI)**: Web app (Vue/Nuxt).
* **Backend**: NestJS + Docker SDK/Dockerode.
* **Database**: PostgreSQL.
* **Hạ tầng**: Docker host server.

### 2.2 Chức năng chính

| Chức năng | Mô tả |
|----|----|
| Đăng nhập admin | Xác thực và phân quyền admin. |
| Quản lý wallet account | Tạo, cập nhật, xóa wallet account dùng để chạy Hydra node. |
| Quản lý node | Khởi tạo node Hydra mới, chỉnh sửa cấu hình, bật/tắt container. |
| Ghép node thành Hydra Head | Chọn nhiều node, cấu hình head, start/stop head. |
| Giám sát trạng thái | Theo dõi container, node, head. |
| API cho tích hợp | Cung cấp API REST cho UI và các ứng dụng bên ngoài. |

### 2.3 Actor

* **Admin**: Người dùng đăng nhập, quản lý node.
* **System**: Hexcore backend, Docker, DB.

### 2.4 Use Case chính


1. Admin đăng nhập hệ thống.
2. Admin thêm wallet account mới.
3. Admin tạo Hydra node với cấu hình.
4. Admin bật/tắt node.
5. Admin chọn nhiều node và ghép thành Hydra Head.
6. Admin start Hydra Head.
7. Hệ thống ghi log và lưu trạng thái vào DB.


---

## 3. Yêu cầu chức năng

### 3.1 Hexcore UI

* Cho phép đăng nhập/đăng xuất.
* Quản lý danh sách wallet account.
* Quản lý node (tạo, cấu hình, bật/tắt, xóa).
* Tạo Hydra Head từ nhiều node.
* Hiển thị trạng thái real-time node/head.

### 3.2 Backend NestJS

* Module Authentication (JWT/OAuth).
* Module Node Management: quản lý cấu hình, điều khiển Docker container.
* Module Wallet Management: CRUD wallet accounts.
* Module Head Management: ghép node thành head, start/stop.
* API REST/GraphQL cho Hexcore UI.

### 3.3 Database (Postgres)

* Bảng `users`: tài khoản admin.
* Bảng `wallets`: thông tin ví dùng cho node.
* Bảng `nodes`: cấu hình node Hydra.
* Bảng `heads`: cấu hình Hydra Head (nhiều node).
* Bảng `logs`: ghi lại hành động và trạng thái.


---

## 4. Yêu cầu phi chức năng

* **Hiệu suất**: Start/Stop node ≤ 5s.
* **Bảo mật**: Mật khẩu admin mã hóa, JWT token, hạn chế API public.
* **Khả năng mở rộng**: Hỗ trợ ≥ 50 node cùng lúc.
* **Tính sẵn sàng**: 99.9% uptime, tự khởi động lại khi container lỗi.
* **Khả năng tích hợp**: API chuẩn REST, hỗ trợ SDK/dApps bên ngoài.


---

## 5. Ràng buộc và giả định

* **Ràng buộc**:
  * Yêu cầu Docker host để chạy Hydra node.
  * PostgreSQL phải được cài đặt và kết nối ổn định.
  * Hydra node phiên bản chuẩn (theo Hydra protocol).
* **Giả định**:
  * Admin có kiến thức cơ bản về Cardano & Hydra.
  * Server đủ tài nguyên để chạy nhiều container.


---

## 6. Kiến trúc hệ thống

```mermaidjs
flowchart TD
    subgraph UI[Hexcore UI - Web App]
        A1[Đăng nhập Admin]
        A2[Quản lý Hydra Node]
        A3[Quản lý Wallet Account]
        A4[Tùy chỉnh cấu hình Node]
        A5[Tạo & Start Hydra Head]
    end

    subgraph Backend[NestJS Backend Service]
        B1[Auth & Quản lý tài khoản Admin]
        B2[Quản lý cấu hình Node]
        B3["Điều khiển Docker Container<br/> (Run/Stop Node)"]
        B4[Quản lý Wallet Account]
        B5[API cho UI & SDK]
    end

    subgraph DB["(PostgreSQL DB)"]
        D1[Tài khoản Admin]
        D2[Cấu hình Node]
        D3[Trạng thái Container]
        D4[Wallet Account]
    end

    subgraph Hydra[Hydra Nodes Cluster]
        H1[Hydra Node 1 - Container]
        H2[Hydra Node 2 - Container]
        H3[Hydra Node N - Container]
    end

    UI --> Backend
    Backend --> DB
    Backend --> Hydra
```


---

## 7. Use Case chi tiết (ví dụ)

### UC-01: Đăng nhập Admin

* **Actor**: Admin
* **Mô tả**: Admin nhập user/password → Backend xác thực → Trả về JWT token.
* **Kết quả**: Admin truy cập UI để quản lý node.

### UC-02: Tạo Node Hydra

* **Actor**: Admin
* **Mô tả**: Admin nhập thông tin cấu hình node → Backend lưu DB → Docker run container → Node hoạt động.
* **Kết quả**: Node Hydra mới xuất hiện trong danh sách.

### UC-03: Ghép Node thành Hydra Head

* **Actor**: Admin
* **Mô tả**: Admin chọn nhiều node → Backend tạo Hydra Head config → Docker start các container → Head khởi chạy.
* **Kết quả**: Hydra Head hoạt động, sẵn sàng cho giao dịch.


---

## 8. Phụ lục

* **Hydra Node**: Một node off-chain trong Hydra protocol.
* **Hydra Head**: Tập hợp nhiều Hydra node cùng tham gia.
* **Wallet Account**: Ví Cardano dùng để chạy node.
* **Docker Container**: Môi trường ảo hóa nhẹ cho mỗi Hydra node.

