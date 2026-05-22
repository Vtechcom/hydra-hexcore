# Đặc tả Quy trình CLI Setup Wizard — Hydra Hexcore

**Phiên bản tài liệu:** v1.1
**Ngày:** 2026-05-22
**Tác giả:** Randolph (Vtechcom Team)
**Trạng thái:** Draft — Đã cập nhật theo phản hồi review lần 1

---

## 1. Tổng quan

### 1.1 Mục tiêu

Xây dựng một **CLI Setup Wizard** tương tác, dẫn dắt người dùng mới qua toàn bộ quy trình cài đặt và cấu hình **Hydra Hexcore** từ đầu đến khi chạy được, thay thế việc phải đọc và chỉnh sửa file `.env` thủ công.

### 1.2 Nguyên tắc thiết kế

| Nguyên tắc            | Mô tả                                                                           |
| --------------------- | ------------------------------------------------------------------------------- |
| **Step-by-step**      | Hiện từng bước một, không overwhelm người dùng                                  |
| **Fail-fast**         | Kiểm tra prerequisites sớm nhất có thể, thông báo ngay nếu thiếu                |
| **Sensible defaults** | Gợi ý giá trị mặc định hợp lý cho từng câu hỏi                                  |
| **Auto-detect**       | Tự động tìm cấu hình có sẵn (docker socket, cardano-node path...) trước khi hỏi |
| **Safe write**        | Backup `.env` cũ trước khi ghi, không bao giờ mất cấu hình hiện có              |
| **Resumable**         | Nếu wizard bị hỏng giữa chừng, có thể chạy lại mà không phải bắt đầu từ đầu     |

### 1.3 Lý do chạy bằng `pnpm` thay vì Docker

> **⚠️ Quan trọng — Constraint kiến trúc:**
>
> Hexcore **không thể** chạy bên trong Docker container vì hệ thống cần truy cập `docker.sock` của máy host để điều khiển các container Hydra Node con. Khi Hexcore chạy trong container, socket path `/var/run/docker.sock` được mount vào container của Hexcore, nhưng Docker-in-Docker yêu cầu quyền đặc biệt (`--privileged`) và tạo ra rủi ro bảo mật nghiêm trọng.
>
> **Giải pháp:** Hexcore phải chạy **trực tiếp trên máy host** qua `pnpm build && pnpm start:prod`.

---

## 2. Kiến trúc Flow tổng thể

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEXCORE CLI SETUP WIZARD  (Linux only)                            │
│                                                                     │
│  PHASE 0: Kiểm tra Prerequisites                                    │
│    └─> Node.js ✓/✗  pnpm ✓/✗  Docker ✓/✗  Docker Compose ✓/✗     │
│        [cardano-node ✓/✗  ogmios ✓/✗ — chỉ cardano-node mode]     │
│                                                                     │
│  PHASE 1: Chọn chế độ kết nối Cardano                              │
│    └─> [A] Blockfrost   [B] Cardano Node                           │
│                                                                     │
│  PHASE 2: Chọn phiên bản Hydra Node                               │
│    └─> 1.2.0 / 1.3.0 / 2.0.0 / 2.1.0                             │
│                                                                     │
│  PHASE 3: Chọn mạng Cardano                                        │
│    └─> mainnet / preprod / preview                                  │
│                                                                     │
│  PHASE 4: Cấu hình thư mục lưu trữ Hydra                          │
│    └─> Đường dẫn tuyệt đối, tự động tạo nếu chưa có               │
│                                                                     │
│  PHASE 5: Kiểm tra Mithril Snapshot                                │
│    └─> Có snapshot? ✓ tiếp tục / ✗ cảnh báo thời gian sync        │
│        (chỉ cardano-node mode)                                      │
│                                                                     │
│  PHASE 6: Cấu hình số node tối đa                                  │
│    └─> MAX_ACTIVE_NODES (mặc định: 20)                             │
│                                                                     │
│  PHASE 7: Cấu hình Docker Socket (Linux /var/run/docker.sock)      │
│    └─> Tự detect → verify quyền → hướng dẫn nếu thiếu quyền       │
│                                                                     │
│  PHASE 8A hoặc 8B: Cấu hình connection-specific                   │
│    └─> [A] Blockfrost URL + Project ID                              │
│    └─> [B] Cardano Node image / service name / socket / folder     │
│             + Ogmios host:port (bắt buộc)                          │
│             + Kiểm tra & cấp quyền node.socket                     │
│                                                                     │
│  PHASE 9: Cấu hình Database                                         │
│    └─> MySQL host/port/user/pass/dbname                            │
│                                                                     │
│  PHASE 10: Cấu hình Port & JWT                                     │
│    └─> PORT, JWT_SECRET                                            │
│                                                                     │
│  PHASE 11: Cấu hình Hub API Key                                    │
│    └─> Thông báo nhận qua email sau khi đăng ký provider           │
│                                                                     │
│  PHASE 12: Review & Xác nhận                                       │
│    └─> Hiển thị toàn bộ cấu hình, hỏi xác nhận                    │
│                                                                     │
│  PHASE 13: Ghi .env + Khởi động                                    │
│    └─> Backup .env.bak → ghi .env mới → pnpm install → pnpm build │
│        → DB init → pnpm start:prod                                 │
│                                                                     │
│  PHASE 13B: Nginx (tuỳ chọn — production)                         │
│    └─> Hướng dẫn cài Nginx + cấu hình reverse proxy + HTTPS        │
│                                                                     │
│  PHASE 14: Post-start — Đăng ký Provider                          │
│    └─> Hướng dẫn chạy seed để tạo admin và đăng ký Provider       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Đặc tả chi tiết từng Phase

---

### PHASE 0 — Kiểm tra Prerequisites

**Mô tả:** Kiểm tra tất cả công cụ bắt buộc đã được cài đặt và đạt version tối thiểu chưa. Đây là bước đầu tiên, thực thi trước toàn bộ các bước còn lại. Nếu bất kỳ mục nào thất bại, wizard dừng lại và hướng dẫn cách khắc phục.

#### 0.1 Danh sách kiểm tra

| Công cụ            | Lệnh kiểm tra                       | Yêu cầu tối thiểu | Ghi chú                                                                   |
| ------------------ | ----------------------------------- | ----------------- | ------------------------------------------------------------------------- |
| **Node.js**        | `node --version`                    | `>= 20.x`         | Bắt buộc                                                                  |
| **pnpm**           | `pnpm --version`                    | `>= 8.x`          | Bắt buộc — cài: `npm install -g pnpm`                                     |
| **Docker**         | `docker --version`                  | `>= 24.x`         | Bắt buộc                                                                  |
| **Docker Compose** | `docker compose version`            | `>= 2.x` (plugin) | Bắt buộc — dùng `docker compose` (v2), không phải `docker-compose` (v1)   |
| **Git**            | `git --version`                     | bất kỳ            | Khuyến nghị nếu clone từ repo                                             |
| **cardano-node**   | `cardano-node --version`            | `>= 10.x`         | **Chỉ khi chọn cardano-node mode** ở PHASE 1                              |
| **ogmios**         | `curl http://localhost:1337/health` | service running   | **Chỉ khi chọn cardano-node mode** — phải chạy song song với cardano-node |

> **Nền tảng hỗ trợ:** Wizard chỉ hỗ trợ **Linux**. Không hỗ trợ Windows hoặc macOS.

#### 0.2 Hành vi

```
Đang kiểm tra hệ thống...

  [✓] Node.js  v20.14.0
  [✓] pnpm     v9.4.0
  [✓] Docker   v27.1.1
  [✓] Docker Compose  v2.29.1
  [✓] Git      v2.43.0

Tất cả dependencies đã sẵn sàng.
```

**Khi thiếu một công cụ:**

```
  [✗] pnpm  — Chưa cài đặt

  Để cài đặt pnpm:
    npm install -g pnpm

  Sau khi cài xong, chạy lại wizard này.
  Nhấn Enter để mở hướng dẫn bằng trình duyệt, hoặc gõ 'skip' để bỏ qua...
```

**Khi version thấp hơn:**

```
  [⚠] Node.js  v18.12.0  (yêu cầu >= 20.x)

  Node.js phiên bản 18 không được hỗ trợ.
  Cài đặt Node.js 20+ qua nvm:
    nvm install 20
    nvm use 20

  Wizard sẽ dừng tại đây cho đến khi Node.js được nâng cấp.
```

---

### PHASE 1 — Chọn chế độ kết nối Cardano

**Mô tả:** Người dùng chọn phương thức giúp Hexcore truy vấn blockchain Cardano.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 1/11 — Chế độ kết nối Cardano
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore cần kết nối vào mạng Cardano để vận hành Hydra Node.
Chọn một trong hai phương thức:

  [1] Blockfrost  ⭐ Đề xuất cho người mới
        - Chỉ cần API key từ blockfrost.io
        - Nhanh, không cần sync blockchain
        - Phụ thuộc dịch vụ bên thứ 3

  [2] Cardano Node  (Nâng cao)
        - Tự chạy cardano-node full node
        - Không phụ thuộc bên thứ 3, có thể offline
        - Yêu cầu kỹ thuật cao, chiếm nhiều tài nguyên
        - Cần sync toàn bộ blockchain nếu chưa có Mithril

Nhập lựa chọn [1/2] (Enter = 1):
```

**Giá trị mặc định:** `1` (Blockfrost)

**Biến env kết quả:**

```dotenv
CARDANO_CONNECTION_MODE=blockfrost   # hoặc cardano-node
```

> **Logic phân nhánh:** Sau Phase 1, nếu chọn `cardano-node` thì Phase 0 sẽ tiếp tục kiểm tra `cardano-node` CLI.

---

### PHASE 2 — Chọn phiên bản Hydra Node

**Mô tả:** Người dùng chọn Docker image của Hydra Node sẽ được Hexcore sử dụng để tạo các container.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 2/11 — Phiên bản Hydra Node
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore sẽ tạo các Hydra Node container từ image sau.
Chọn phiên bản Hydra Node:

  [1] 1.2.0  ← Ổn định, khuyến nghị
  [2] 1.3.0
  [3] 2.0.0
  [4] 2.1.0  ← Mới nhất

Nhập lựa chọn [1-4] (Enter = 1):
```

**Bảng Script TX IDs tự động điền theo version + network (PHASE 3):**

> Wizard tự động điền `NEST_HYDRA_NODE_SCRIPT_TX_ID` sau khi biết cả version lẫn network. Người dùng không cần nhập thủ công.
>
> **Implementation note:** Tất cả TX IDs được **hardcode** trong `constants/tx-ids.ts`. Không fetch từ GitHub tại runtime vì các TX IDs của mỗi version đã được publish và sẽ không thay đổi. Khi có version mới được thêm vào danh sách hỗ trợ, cập nhật bảng hardcode và release phiên bản mới của wizard.

| Version   | Network | Script TX IDs (3 TXs, phân cách bằng dấu phẩy)                                                                                                                                                       |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.2.0** | preview | `3c275192a7b5ff199f2f3182f508e10f7e1da74a50c4c673ce0588b8c621ed45,6f8a4b6404d4fdd0254507e95392fee6a983843eb168f9091192cbec2b99f83d,60d61b2f10897bf687de440a0a8b348a57b1fc3786b7b8b1379a65ace1de199a` |
| **1.2.0** | preprod | `ba97aaa648271c75604e66e3a4e00da49bdcaca9ba74d9031ab4c08f736e1c12,ff046eba10b9b0f90683bf5becbd6afa496059fc1cf610e798cfe778d85b70ba,4bb8c01290599cc9de195b586ee1eb73422b00198126f51f52b00a8e35da9ce3` |
| **1.2.0** | mainnet | `e2512f44bb43f9c44dc3db495ce6a8ba6db6d8afaad2e3494b32d591845fb259,a5e683efe3acd02b7a1d0c13d1517672b2c78a74abd08dd455c34290150ea4d7,d0f70c628778a7d2e71ab366ad6112890b5fa5596ef553bc18accf66875af203` |
| **1.3.0** | preview | _(cần điền — tra tại `github.com/cardano-scaling/hydra/releases/tag/1.3.0`)_                                                                                                                         |
| **1.3.0** | preprod | _(cần điền)_                                                                                                                                                                                         |
| **1.3.0** | mainnet | _(cần điền)_                                                                                                                                                                                         |
| **2.0.0** | preview | _(cần điền — tra tại `github.com/cardano-scaling/hydra/releases/tag/2.0.0`)_                                                                                                                         |
| **2.0.0** | preprod | _(cần điền)_                                                                                                                                                                                         |
| **2.0.0** | mainnet | _(cần điền)_                                                                                                                                                                                         |
| **2.1.0** | preview | _(cần điền — tra tại `github.com/cardano-scaling/hydra/releases/tag/2.1.0`)_                                                                                                                         |
| **2.1.0** | preprod | _(cần điền)_                                                                                                                                                                                         |
| **2.1.0** | mainnet | _(cần điền)_                                                                                                                                                                                         |

> **TODO trước khi implement:** Điền TX IDs cho version 1.3.0, 2.0.0, 2.1.0 vào bảng trên bằng cách tra `networks.json` tại trang releases tương ứng.

**Bảng tương thích cardano-node:**

| Hydra Version | cardano-node tương thích | Ghi chú                    |
| ------------- | ------------------------ | -------------------------- |
| `1.2.0`       | `10.5.3`                 | Ổn định, đã được test kỹ   |
| `1.3.0`       | _(tra release notes)_    | —                          |
| `2.0.0`       | _(tra release notes)_    | Có thể có breaking changes |
| `2.1.0`       | _(tra release notes)_    | Mới nhất                   |

**Biến env kết quả:**

```dotenv
NEST_HYDRA_NODE_IMAGE=ghcr.io/cardano-scaling/hydra-node:1.2.0
NEST_HYDRA_NODE_SCRIPT_TX_ID=<tự động điền sau PHASE 3>
```

---

### PHASE 3 — Chọn mạng Cardano

**Mô tả:** Chọn mạng Cardano để vận hành.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 3/11 — Mạng Cardano
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Chọn mạng Cardano:

  [1] preprod  ← Test network chính (khuyến nghị để thử nghiệm)
  [2] preview  ← Test network mới nhất
  [3] mainnet  ← Mạng chính, dùng ADA thật ⚠

  ⚠ Cảnh báo: Mainnet sử dụng ADA thật. Chỉ chọn nếu bạn đã
    sẵn sàng và hiểu rõ rủi ro tài chính.

Nhập lựa chọn [1-3] (Enter = 1):
```

**Logic sau khi chọn:**

- Wizard tự động xác định `CARDANO_NETWORK`, `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID`
- Wizard tự động điền `NEST_HYDRA_NODE_SCRIPT_TX_ID` dựa vào (version từ PHASE 2 + network)

**Biến env kết quả:**

```dotenv
CARDANO_NETWORK=testnet           # hoặc mainnet
NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID=1   # preprod=1 | preview=2 | mainnet=bỏ qua
NEST_HYDRA_NODE_SCRIPT_TX_ID=<hash1,hash2,hash3>
```

| Network | `CARDANO_NETWORK` | `NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID` |
| ------- | ----------------- | --------------------------------------- |
| preprod | `testnet`         | `1`                                     |
| preview | `testnet`         | `2`                                     |
| mainnet | `mainnet`         | _(không cần)_                           |

---

### PHASE 4 — Cấu hình thư mục lưu trữ Hydra

**Mô tả:** Chọn đường dẫn thư mục trên máy host lưu dữ liệu persistence (keys, DB state) của các Hydra Node.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 4/11 — Thư mục lưu trữ Hydra Node
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hydra Node cần một thư mục trên máy host để lưu:
  - Keys mật mã (signing keys)
  - Dữ liệu persistence của từng node
  - Logs nội bộ của node

Đường dẫn thư mục lưu Hydra Node
(Enter = /home/<user>/hydra/preprod):
```

**Logic:**

- Đề xuất mặc định: `~/hydra/<network>` (vd: `~/hydra/preprod`)
- Nếu đường dẫn chưa tồn tại: hỏi xác nhận tạo mới
- Tự động tạo thư mục và set permissions: `chmod 755`
- Cảnh báo nếu ổ đĩa còn lại < 50GB (Hydra Node cần không gian đáng kể)

**Biến env kết quả:**

```dotenv
NEST_HYDRA_NODE_FOLDER=/home/user/hydra/preprod
```

---

### PHASE 5 — Kiểm tra Mithril Snapshot

**Mô tả:** Thông báo về Mithril, một công cụ giúp đồng bộ blockchain Cardano cực nhanh thay vì sync từ genesis (có thể mất nhiều ngày).

> **Lưu ý:** Phase này chỉ hiển thị khi người dùng chọn chế độ `cardano-node` ở PHASE 1. Với Blockfrost, bỏ qua.

#### Giao diện — Khi chọn cardano-node mode

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 5/11 — Trạng thái Mithril Snapshot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Mithril là công cụ giúp tải snapshot blockchain Cardano đã được
  chứng nhận, giúp cardano-node sync trong vài giờ thay vì nhiều ngày.

Cardano-node của bạn đã được sync hoàn toàn chưa?

  [1] Đã sync xong
  [2] Đang sync (chưa xong)
  [3] Chưa bắt đầu sync

Nhập lựa chọn [1-3]:
```

**Khi chọn [3] (Chưa bắt đầu):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️ CẢNH BÁO — Thời gian đồng bộ Database
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nếu bắt đầu sync từ đầu (từ genesis), cardano-node cần:
  - Mạng Preprod:  ~1-3 ngày (tùy phần cứng và băng thông)
  - Mạng Preview:  ~12-24 giờ
  - Mạng Mainnet:  ~3-7 ngày hoặc hơn

Mithril có thể rút ngắn thời gian này xuống còn vài giờ.

  ✅ Có sử dụng Mithril:
     Tải Mithril tại: https://mithril.network/doc/manual/getting-started/bootstrap-cardano-node

  ❌ Không có Mithril:
     Hexcore vẫn sẽ chạy, nhưng cardano-node sẽ cần nhiều ngày
     để đồng bộ xong. Trong thời gian chờ, một số tính năng của
     Hexcore sẽ không hoạt động được cho đến khi node fully synced.

Bạn có muốn tiếp tục mà không có Mithril? [yes/no] (Enter = no):
```

**Khi chọn [2] (Đang sync):**

```
⚠️  Cardano node của bạn vẫn đang trong quá trình sync.
   Hexcore có thể khởi động, nhưng sẽ có lỗi kết nối đến node
   cho đến khi quá trình sync hoàn tất.

   Bạn có thể kiểm tra trạng thái sync bằng lệnh:
     cardano-cli query tip --testnet-magic 1

Tiếp tục cấu hình? [yes/no] (Enter = yes):
```

---

### PHASE 6 — Số lượng node tối đa

**Mô tả:** Cấu hình số lượng Hydra Node container có thể chạy đồng thời.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 6/11 — Số node active tối đa
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Số lượng Hydra Node container có thể chạy cùng lúc.
Mỗi node chiếm ~512MB RAM. Khuyến nghị không vượt quá RAM khả dụng / 512MB.

RAM phát hiện: ~15.8 GB — có thể chạy tối đa ~30 node

Số node tối đa (Enter = 20):
```

**Validation:**

- Phải là số nguyên dương
- Cảnh báo nếu > (RAM_GB \* 1000) / 512
- Tối thiểu: 1

**Biến env kết quả:**

```dotenv
MAX_ACTIVE_NODES=20
```

---

### PHASE 7 — Docker Socket Path

**Mô tả:** Wizard tự động tìm đường dẫn Docker socket. Nếu không tìm thấy, hỏi người dùng.

#### Logic tự động detect

Wizard kiểm tra theo thứ tự:

1. `/var/run/docker.sock` — Linux/macOS tiêu chuẩn
2. `~/.docker/run/docker.sock` — Docker Desktop on macOS

#### Giao diện — Khi tìm thấy

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 7/11 — Docker Socket
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [✓] Tìm thấy Docker socket: /var/run/docker.sock

Hexcore dùng socket này để điều khiển các Hydra Node container.
Lý do phải chạy bằng pnpm thay vì Docker:

  ℹ️  Hexcore không thể chạy TRONG Docker container vì:
     - Khi Hexcore chạy trong container, nó không thể ánh xạ
       docker.sock của máy host sang chính nó.
     - Docker-in-Docker yêu cầu --privileged gây rủi ro bảo mật.
  → Hexcore phải chạy trực tiếp trên máy host qua pnpm.

Dùng socket này không? [yes/no] (Enter = yes):
```

#### Giao diện — Khi không tìm thấy

```
  [✗] Không tìm thấy Docker socket tự động.

Nhập đường dẫn Docker socket:
  Linux/macOS: /var/run/docker.sock
  Windows:     \\.\pipe\docker_engine

Docker socket path:
```

**Biến env kết quả:**

```dotenv
NEST_DOCKER_SOCKET_PATH=/var/run/docker.sock
NEST_DOCKER_ENABLE_NETWORK_HOST=false
```

---

### PHASE 8A — Cấu hình Blockfrost (chỉ khi chọn Blockfrost)

**Mô tả:** Nhập thông tin kết nối Blockfrost API.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 8/11 — Cấu hình Blockfrost
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cần thông tin từ tài khoản Blockfrost của bạn.
Đăng ký miễn phí tại: https://blockfrost.io

API Base URL đã được điền tự động dựa vào mạng đã chọn:
  Mạng: preprod
  URL:  https://cardano-preprod.blockfrost.io/api/v0

Blockfrost API Base URL
(Enter = https://cardano-preprod.blockfrost.io/api/v0):

Blockfrost Project ID (lấy tại blockfrost.io/dashboard):
```

**Bảng Base URL theo network:**

| Network   | Base URL                                       |
| --------- | ---------------------------------------------- |
| `preprod` | `https://cardano-preprod.blockfrost.io/api/v0` |
| `preview` | `https://cardano-preview.blockfrost.io/api/v0` |
| `mainnet` | `https://cardano-mainnet.blockfrost.io/api/v0` |

**Validation:**

- URL phải có format hợp lệ
- Project ID phải có prefix tương ứng với network (vd: `preprod...`)
- Wizard nên test kết nối với Blockfrost API trước khi tiếp tục

**Biến env kết quả:**

```dotenv
BLOCKFROST_API_BASE_URL=https://cardano-preprod.blockfrost.io/api/v0
BLOCKFROST_PROJECT_ID=preprodXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### PHASE 8B — Cấu hình Cardano Node (chỉ khi chọn cardano-node)

**Mô tả:** Nhập đầy đủ thông tin về cardano-node mà người dùng tự chạy, bao gồm Docker image, service name, đường dẫn socket, thư mục config, và cấu hình Ogmios. Tất cả các trường đều **bắt buộc**.

#### 8B.1 — Thông tin Docker container cardano-node

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 8/11 — Cấu hình Cardano Node (1/3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore cần biết thông tin Docker container đang chạy cardano-node.

Tên service (container name) của cardano-node:
(Enter = cardano-node):

Docker image của cardano-node:
(vd: ghcr.io/intersectmbo/cardano-node:10.5.2)
(Enter = ghcr.io/intersectmbo/cardano-node:10.5.2):
```

> **Bảng image tương thích theo Hydra version** (đã chọn ở PHASE 2):
>
> | Hydra Version | cardano-node image khuyến nghị             |
> | ------------- | ------------------------------------------ |
> | `1.2.0`       | `ghcr.io/intersectmbo/cardano-node:10.5.2` |
> | `1.3.0`       | _(tra release notes của hydra 1.3.0)_      |
> | `2.0.0`       | _(tra release notes của hydra 2.0.0)_      |
> | `2.1.0`       | _(tra release notes của hydra 2.1.0)_      |
>
> Wizard sẽ hiển thị gợi ý image mặc định dựa trên version Hydra đã chọn.

#### 8B.2 — Đường dẫn socket và thư mục config

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 8/11 — Cấu hình Cardano Node (2/3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thư mục config cardano-node trên máy host
(chứa config.json, genesis files):
(Enter = /home/<user>/cardano/preprod):

Đường dẫn đến node.socket của cardano-node:
(Enter = /home/<user>/cardano/preprod/node.socket):
```

**Validation node.socket:**

- Kiểm tra file socket tồn tại: `test -S <path>`
- Nếu không tồn tại: Cảnh báo cardano-node có thể chưa chạy hoặc chưa khởi động xong
- Nếu tồn tại nhưng không có quyền đọc: chuyển sang bước cấp quyền (8B.4)

#### 8B.3 — Cấu hình Ogmios

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 8/11 — Cấu hình Ogmios (3/3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ogmios là bridge giúp Hexcore truy vấn cardano-node qua WebSocket.
Ogmios phải chạy song song với cardano-node và dùng chung node.socket.

Ogmios host
(Enter = localhost):

Ogmios port
(Enter = 1337):
```

**Validation Ogmios (bắt buộc):**

Sau khi nhập host:port, wizard **tự động kiểm tra** kết nối:

```bash
curl -s http://<host>:<port>/health
```

**Nếu Ogmios trả về response hợp lệ:**

```
  [✓] Ogmios đang chạy tại localhost:1337
      Phiên bản: 6.x.x
      Đã kết nối với cardano-node
```

**Nếu Ogmios không phản hồi (lỗi connection refused hoặc timeout):**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⛔ Không thể kết nối Ogmios tại localhost:1337
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ogmios là bắt buộc khi chạy ở chế độ cardano-node.
Hexcore sẽ không hoạt động nếu Ogmios không chạy.

Khởi động Ogmios:
  Ogmios thường chạy cùng docker-compose với cardano-node.
  Xem hướng dẫn tại: https://ogmios.dev

  [1] Thử lại (tôi đã khởi động Ogmios)
  [2] Bỏ qua cảnh báo và tiếp tục cấu hình (nguy hiểm)
  [3] Quay lại nhập host:port khác

Lựa chọn [1/2/3]:
```

> **Lưu ý:** Không cho phép tiếp tục cài đặt mà không cảnh báo. Chọn [2] phải hiển thị thêm xác nhận: `"Hexcore sẽ KHÔNG thể hoạt động cho đến khi Ogmios chạy. Bạn hiểu và muốn tiếp tục? [yes/no]"` .

#### 8B.4 — Kiểm tra và cấp quyền node.socket

Đây là bước **riêng** sau khi nhập đường dẫn socket, thực hiện **tự động** trước khi chuyển sang phase tiếp theo.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Kiểm tra quyền truy cập node.socket
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kiểm tra quyền: /home/user/cardano/preprod/node.socket
```

**Kịch bản 1 — Có quyền:**

```
  [✓] node.socket tìm thấy
  [✓] User "<username>" có quyền đọc/ghi socket
  Tiếp tục...
```

**Kịch bản 2 — Không có quyền (phổ biến khi cardano-node chạy bằng root hoặc user khác):**

```
  [✓] node.socket tìm thấy
  [✗] User "<username>" KHÔNG có quyền đọc/ghi socket.

  Thông tin hiện tại của socket:
    $ ls -la /home/user/cardano/preprod/node.socket
    srwxr-xr-x 1 root root 0 May 22 10:00 node.socket

  Hexcore cần quyền đọc/ghi vào socket này để:
    - Truy vấn trạng thái blockchain qua Ogmios
    - Điều phối các Hydra Node kết nối vào cardano-node

  Cách khắc phục (chọn một):

  [1] Tự động cấp quyền (chạy lệnh dưới đây với sudo):
         sudo chmod 777 /home/user/cardano/preprod/node.socket
      ⚠  Lưu ý: Quyền 777 cho phép mọi user truy cập socket.
         Phù hợp cho môi trường dev/test, KHÔNG khuyến nghị production.

  [2] Thêm user vào group sở hữu socket:
         sudo usermod -aG <group-owner> $USER
         newgrp <group-owner>
      Sau đó khởi động lại wizard.

  [3] Bỏ qua (socket sẽ được cấu hình thủ công sau)

Lựa chọn [1/2/3]:
```

**Khi chọn [1] — Wizard tự động chạy:**

```bash
sudo chmod 777 <socket_path>
```

Và xác nhận lại sau khi chạy.

**Kịch bản 3 — socket không tồn tại:**

```
  [⚠] node.socket chưa tồn tại tại: /home/user/cardano/preprod/node.socket

  Nguyên nhân có thể:
    - cardano-node chưa được khởi động
    - cardano-node đang khởi động (cần chờ thêm)
    - Đường dẫn cấu hình sai

  Hexcore sẽ lưu đường dẫn này vào .env.
  Khi cardano-node khởi động xong và tạo socket, Hexcore sẽ tự động kết nối.

  Tiếp tục? [yes/no] (Enter = yes):
```

**Biến env kết quả:**

```dotenv
NEST_CARDANO_NODE_SERVICE_NAME=cardano-node
NEST_CARDANO_NODE_IMAGE=ghcr.io/intersectmbo/cardano-node:10.5.2
NEST_CARDANO_NODE_FOLDER=/home/user/cardano/preprod
NEST_CARDANO_NODE_SOCKET_PATH=/home/user/cardano/preprod/node.socket
NEST_OGMIOS_HOST=localhost
NEST_OGMIOS_PORT=1337
```

---

### PHASE 9 — Cấu hình Database (MySQL)

**Mô tả:** Cấu hình kết nối MySQL. Hệ thống mặc định dùng MySQL chạy qua Docker Compose theo cấu hình có sẵn.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 9/11 — Cấu hình Database (MySQL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore cần MySQL để lưu dữ liệu.

Dự án đã có sẵn cấu hình Docker Compose tại:
  configs/mysql-databases/docker-compose.yaml

  [1] Dùng cấu hình có sẵn (localhost:3327 — khuyến nghị)
  [2] Nhập thông tin MySQL tùy chỉnh

Nhập lựa chọn [1/2] (Enter = 1):
```

**Khi chọn [1] — dùng cấu hình mặc định:**

```
Wizard sẽ tự động khởi động MySQL container khi cài đặt xong.

Cấu hình MySQL sẽ dùng:
  Host:     localhost
  Port:     3327
  User:     hexcore_user
  Password: hexcore_password
  Database: hexcore_db
```

**Biến env kết quả:**

```dotenv
DB_HOST=localhost
DB_PORT=3327
DB_USERNAME=hexcore_user
DB_PASSWORD=hexcore_password
DB_DATABASE=hexcore_db
DB_SYNCHRONIZE=true
```

---

### PHASE 10 — Cấu hình Port & JWT Secret

**Mô tả:** Chọn port cho HTTP server và JWT secret key.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 10/11 — Port & Bảo mật
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Port chạy Hexcore API server [3000]:

JWT Secret Key (để trống = tự động sinh ngẫu nhiên):
  ★ Khuyến nghị: để trống và để wizard tự tạo.
  ★ Nếu nhập thủ công, cần ít nhất 32 ký tự.

JWT Secret (Enter = tự động sinh):
```

**Logic:**

- Kiểm tra port được nhập chưa bị chiếm: `lsof -i :<port>` hoặc `ss -tlnp | grep :<port>`
- Nếu port bị chiếm: cảnh báo và đề xuất port khác
- JWT Secret: nếu để trống, tự tạo random 64-char hex string

**Biến env kết quả:**

```dotenv
PORT=3000
JWT_SECRET=<random 64-char hex hoặc giá trị người dùng nhập>
LOG_DIR=logs
```

---

### PHASE 11 — Hub API Key & Hydra Hub

**Mô tả:** Cấu hình kết nối đến Hydra Hub — hệ thống quản lý trung tâm.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC 11/11 — Hydra Hub API Key
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore kết nối với Hydra Hub để đăng ký và nhận lệnh quản lý.

Hydra Hub API URL:
  Dev:  https://dev-api.hydrahub.io.vn/
  UAT:  https://uat-api.hydrahub.io.vn/
  Prod: https://api.hydrahub.io.vn/

Hydra Hub API Base URL
(Enter = https://dev-api.hydrahub.io.vn/):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ℹ️  Về HUB_API_KEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  HUB_API_KEY là key xác thực giữa Hexcore và Hydra Hub.
  Key này KHÔNG thể đặt lúc cài đặt — bạn sẽ nhận key này
  qua EMAIL sau khi:

    1. Chạy lệnh seed để đăng ký Provider (sau PHASE 14)
    2. Hydra Hub Team xem xét và phê duyệt Provider của bạn
    3. Key sẽ được gửi về email bạn đăng ký

  Sau khi nhận key, thêm vào .env:
    HUB_API_KEY=<key nhận được>
  Rồi khởi động lại:
    pnpm start:prod

  Hiện tại, để trống hoặc nhập placeholder...

HUB_API_KEY (Enter = để trống tạm thời):
```

**Biến env kết quả:**

```dotenv
HYDRA_HUB_API_BASE_URL=https://dev-api.hydrahub.io.vn/
HUB_API_KEY=
```

---

### PHASE 12 — Review & Xác nhận

**Mô tả:** Hiển thị toàn bộ cấu hình sẽ được ghi vào `.env` để người dùng xem lại trước khi áp dụng.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  XEM LẠI CẤU HÌNH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dưới đây là toàn bộ cấu hình sẽ được áp dụng vào .env:

  PORT                               = 3000
  LOG_DIR                            = logs

  CARDANO_NETWORK                    = testnet
  CARDANO_CONNECTION_MODE            = blockfrost
  BLOCKFROST_API_BASE_URL            = https://cardano-preprod.blockfrost.io/api/v0
  BLOCKFROST_PROJECT_ID              = preprod********************  (ẩn)

  NEST_HYDRA_NODE_IMAGE              = ghcr.io/cardano-scaling/hydra-node:1.2.0
  NEST_HYDRA_NODE_SCRIPT_TX_ID       = ba97aa...,ff046e...,4bb8c0...  (3 TXs)
  NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID = 1
  NEST_HYDRA_NODE_FOLDER             = /home/user/hydra/preprod

  MAX_ACTIVE_NODES                   = 20
  ACCOUNT_MIN_LOVELACE               = 50000000

  NEST_DOCKER_SOCKET_PATH            = /var/run/docker.sock
  NEST_DOCKER_ENABLE_NETWORK_HOST    = false

  DB_HOST                            = localhost
  DB_PORT                            = 3327
  DB_USERNAME                        = hexcore_user
  DB_PASSWORD                        = ************  (ẩn)
  DB_DATABASE                        = hexcore_db
  DB_SYNCHRONIZE                     = true

  JWT_SECRET                         = ****************  (ẩn)
  HYDRA_HUB_API_BASE_URL             = https://dev-api.hydrahub.io.vn/
  HUB_API_KEY                        = (trống — cần cập nhật sau khi nhận email)

  RABBITMQ_ENABLED                   = false

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ghi cấu hình này vào .env và tiếp tục cài đặt? [yes/no] (Enter = yes):
```

**Tùy chọn:**

- Nhấn `e` để chỉnh sửa lại từng mục
- Nhấn `yes` để tiếp tục
- Nhấn `no` hoặc `q` để thoát mà không ghi

---

### PHASE 13 — Ghi `.env` & Khởi động

**Mô tả:** Áp dụng cấu hình, khởi động dịch vụ phụ thuộc, build và chạy Hexcore.

#### Sequence thực thi

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ĐANG CÀI ĐẶT...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [1/7] Backup .env cũ → .env.bak.20260522_143022 ....... ✓
  [2/7] Ghi cấu hình vào .env ........................... ✓
  [3/7] Tạo thư mục Hydra: /home/user/hydra/preprod ..... ✓
  [4/7] Khởi động MySQL container ....................... ✓
        cd configs/mysql-databases && docker compose up -d
  [5/7] Cài đặt dependencies: pnpm install .............. ✓
  [6/7] Build dự án: pnpm build ......................... ✓
  [7/7] Khởi động Hexcore: pnpm start:prod .............. ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ HEXCORE ĐÃ KHỞI ĐỘNG THÀNH CÔNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  API:     http://localhost:3000
  Swagger: http://localhost:3000/api-docs

  Logs:    tail -f logs/app-$(date +%Y-%m-%d).log
```

**Xử lý lỗi:**

- Nếu MySQL fail: hiển thị log Docker và gợi ý kiểm tra port conflict
- Nếu `pnpm build` fail: hiển thị lỗi TypeScript, không tiếp tục
- Nếu `pnpm start:prod` fail: hiển thị 20 dòng log cuối, hướng dẫn debug

---

### PHASE 13B — Cấu hình Nginx (Tuỳ chọn — Production)

**Mô tả:** Sau khi Hexcore đang chạy, hỏi người dùng có muốn cấu hình Nginx làm reverse proxy không. Đây là **khuyến nghị cho môi trường production** để có HTTPS và domain thực sự.

**Khi nào cần Nginx:**

- Khi triển khai lên server production có domain thực
- Khi cần HTTPS/TLS (bắt buộc nếu Hexcore được truy cập từ internet)
- Khi muốn domain đẹp thay vì `http://ip:3000`

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  (Tuỳ chọn) Cấu hình Nginx Reverse Proxy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore đang chạy tại http://localhost:3000
Nếu bạn muốn truy cập bằng domain hoặc cần HTTPS,
cần cài đặt Nginx làm reverse proxy.

  [1] Có — Hướng dẫn cài Nginx & cấu hình
  [2] Không — Bỏ qua (có thể cấu hình sau)

Lựa chọn [1/2] (Enter = 2):
```

**Khi chọn [1] — Wizard in ra hướng dẫn:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Hướng dẫn cài đặt Nginx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① Cài đặt Nginx:

  sudo apt update && sudo apt install -y nginx

② Tạo file cấu hình virtual host:

  sudo nano /etc/nginx/sites-available/hexcore

  Dán nội dung sau (thay your-domain.com bằng domain thực):

  ─────────────────────────────────────────
  server {
      listen 80;
      server_name your-domain.com www.your-domain.com;

      location / {
          proxy_pass         http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header   Upgrade $http_upgrade;
          proxy_set_header   Connection 'upgrade';
          proxy_set_header   Host $host;
          proxy_set_header   X-Real-IP $remote_addr;
          proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header   X-Forwarded-Proto $scheme;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ─────────────────────────────────────────

③ Kích hoạt site và reload Nginx:

  sudo ln -s /etc/nginx/sites-available/hexcore /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx

④ Cài SSL/HTTPS với Certbot (miễn phí, tự gia hạn):

  sudo apt install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d your-domain.com -d www.your-domain.com

⑤ Kiểm tra HTTPS:

  curl https://your-domain.com/health

⑥ Sau khi có HTTPS, cập nhật HEXCORE_URL trong bước đăng ký Provider
   thành URL HTTPS của bạn (vd: https://your-domain.com)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ℹ️  Lưu ý quan trọng
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Certbot tự động gia hạn certificate mỗi 90 ngày.
  - Đảm bảo port 80 và 443 được mở trong firewall:
      sudo ufw allow 'Nginx Full'
  - Nếu dùng cloud server (AWS, GCP, Azure), mở port 80 & 443
    trong Security Group/Firewall rules.
```

---

### PHASE 14 — Đăng ký Provider (Post-start)

**Mô tả:** Sau khi Hexcore đang chạy, hướng dẫn người dùng tạo tài khoản admin và đăng ký Provider lên Hydra Hub.

#### Giao diện

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BƯỚC TIẾP THEO — Tạo Admin & Đăng ký Provider
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hexcore đang chạy! Bước tiếp theo bạn cần:

  ① Tạo tài khoản Admin và đăng ký Provider lên Hydra Hub:

  pnpm seed:run \
    --path=src/migrations/seeders/create-account-admin-and-provider.seeder.ts \
    --username=<tên đăng nhập admin> \
    --password=<mật khẩu admin> \
    --ip=<IPv4 public của server> \
    --provider-name="<Tên Provider của bạn>" \
    --connection-type=blockfrost \
    --network=preprod \
    --hexcore-url=<URL API public của bạn> \
    --email=<email nhận HUB_API_KEY>

  ② Sau khi Provider được duyệt, bạn sẽ nhận được qua EMAIL:
     - HUB_API_KEY        — key xác thực với Hydra Hub
     - RABBITMQ_URI       — URI kết nối RabbitMQ
     - RABBITMQ_EXCHANGE  — Tên exchange
     - RABBITMQ_QUEUE     — Tên queue

  ③ Cập nhật .env với các giá trị nhận được:
     HUB_API_KEY=<key nhận từ email>
     RABBITMQ_ENABLED=true
     RABBITMQ_URI=<uri nhận từ email>
     RABBITMQ_EXCHANGE=<exchange nhận từ email>
     RABBITMQ_QUEUE=<queue nhận từ email>

  ④ Khởi động lại Hexcore:
     pnpm start:prod

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Wizard hoàn thành. Chúc mừng! 🎉
Nếu cần hỗ trợ, xem tài liệu tại: docs/SETUP_GUIDE_VI.md
```

---

## 4. Đặc tả kỹ thuật triển khai CLI

### 4.1 Technology Stack đề xuất

| Yêu cầu              | Thư viện đề xuất                    | Ghi chú                                  |
| -------------------- | ----------------------------------- | ---------------------------------------- |
| Interactive prompts  | `@inquirer/prompts` hoặc `inquirer` | Native TypeScript, maintained by npm     |
| Progress spinner     | `ora`                               | Lightweight, esm-compatible              |
| Colored output       | `chalk`                             | Terminal colors                          |
| CLI argument parsing | `commander` hoặc `yargs`            | Cho phép `--help`, `--skip-checks`, v.v. |
| File system          | Node.js built-in `fs/path`          | Đủ dùng                                  |
| HTTP test call       | `axios`                             | Đã có trong project                      |
| Environment parsing  | `dotenv`                            | Đã có trong project                      |

### 4.2 Entry Point

```
src/cli/
├── setup-wizard.ts      ← Entry point chính
├── phases/
│   ├── phase-0-prerequisites.ts
│   ├── phase-1-connection-mode.ts
│   ├── phase-2-hydra-version.ts
│   ├── phase-3-network.ts
│   ├── phase-4-hydra-folder.ts
│   ├── phase-5-mithril-check.ts
│   ├── phase-6-max-nodes.ts
│   ├── phase-7-docker-socket.ts
│   ├── phase-8a-blockfrost.ts
│   ├── phase-8b-cardano-node.ts
│   ├── phase-9-database.ts
│   ├── phase-10-port-jwt.ts
│   ├── phase-11-hub-api-key.ts
│   ├── phase-12-review.ts
│   ├── phase-13-write-and-start.ts
│   └── phase-13b-nginx.ts
├── utils/
│   ├── env-writer.ts    ← Đọc/ghi .env an toàn
│   ├── system-check.ts  ← Kiểm tra prerequisites
│   ├── docker-detect.ts ← Tìm docker socket
│   ├── script-tx-ids.ts ← Lookup TX IDs từ bảng hardcode
│   ├── socket-check.ts  ← Kiểm tra quyền node.socket
│   └── port-check.ts    ← Kiểm tra port availability
└── constants/
    └── tx-ids.ts        ← Bảng TX IDs hardcoded cho tất cả version + network
```

### 4.3 Script trong `package.json`

```json
{
    "scripts": {
        "setup": "ts-node src/cli/setup-wizard.ts",
        "setup:prod": "node dist/cli/setup-wizard.js"
    }
}
```

Cách chạy:

```bash
pnpm setup
```

### 4.4 Tính năng CLI flags

| Flag            | Mô tả                                           |
| --------------- | ----------------------------------------------- |
| `--skip-checks` | Bỏ qua kiểm tra prerequisites (Phase 0)         |
| `--dry-run`     | Chạy qua toàn bộ wizard nhưng không ghi `.env`  |
| `--reset`       | Xóa cấu hình cũ và bắt đầu lại từ đầu           |
| `--no-start`    | Không tự động khởi động pnpm sau khi ghi `.env` |

### 4.5 State persistence

Wizard lưu trạng thái tạm vào `.setup-state.json` (gitignored) để có thể resume nếu bị gián đoạn:

```json
{
    "version": "1.0",
    "completedPhases": [0, 1, 2, 3],
    "answers": {
        "connectionMode": "blockfrost",
        "hydraVersion": "1.2.0",
        "network": "preprod"
    }
}
```

### 4.6 Backup strategy

```
.env           ← File active
.env.bak.<timestamp>  ← Backup tự động trước mỗi lần ghi
.env.example   ← Template tham khảo (không được sửa)
```

---

## 5. Edge Cases & Xử lý ngoại lệ

| Tình huống                      | Xử lý                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| `.env` đã tồn tại               | Hỏi: "Overwrite? / Merge? / Backup và tạo mới?"                      |
| Port 3000 đang bị chiếm         | Detect và đề xuất port khác (3001, 3010, 3100...)                    |
| Docker daemon không chạy        | Hướng dẫn `sudo systemctl start docker`                              |
| MySQL port 3327 bị chiếm        | Hỏi port thay thế và update docker-compose.yaml                      |
| Không có internet (offline)     | Dùng TX IDs hardcode, bỏ qua bước test Blockfrost connectivity       |
| Hydra folder không có quyền ghi | Hướng dẫn `chmod` hoặc chọn đường dẫn khác                           |
| User không có quyền Docker      | Hướng dẫn `sudo usermod -aG docker $USER && newgrp docker`           |
| Blockfrost API test thất bại    | Hỏi xác nhận "Tiếp tục với API key này?"                             |
| `pnpm install` thất bại         | Hiển thị lỗi, đề xuất `pnpm install --force` hoặc xóa `node_modules` |
| `pnpm build` thất bại           | Hiển thị lỗi TypeScript, dừng wizard                                 |

---

## 6. Quyết định thiết kế đã được xác nhận

| #   | Câu hỏi                                                       | Quyết định                                                                                                                                                                                            |
| --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Script TX IDs cho version 1.3.0, 2.0.0, 2.1.0                 | **Hardcode** — TX IDs của mỗi version đã publish sẽ không thay đổi. Điền vào `constants/tx-ids.ts` sau khi tra trên GitHub releases. Khi có version mới, update bảng và release phiên bản wizard mới. |
| 2   | Hỗ trợ Windows không?                                         | **Không** — Chỉ hỗ trợ Linux. Không cần xử lý Windows socket path hay shell commands.                                                                                                                 |
| 3   | `ACCOUNT_MIN_LOVELACE` hỏi hay hardcode?                      | **Hardcode** = `50000000` — không hỏi user, ghi cố định vào `.env`.                                                                                                                                   |
| 4   | Ogmios host/port có thể override không?                       | **Có, phải hỏi và validate** — Ogmios theo cấu hình do user tự chạy. Phải kiểm tra kết nối và cảnh báo rõ nếu không thể kết nối (xem PHASE 8B.3).                                                     |
| 5   | Wizard có hỗ trợ `--update` mode không?                       | **Không có trong v1** — Đưa vào backlog v2.                                                                                                                                                           |
| 6   | DB test credentials (`DB_HOST_TEST`, v.v.)                    | **Không cần** — Chỉ phục vụ `test:e2e`, không đưa vào wizard. Hardcode giá trị mặc định hoặc bỏ qua.                                                                                                  |
| 7   | `NEST_CARDANO_NODE_IMAGE` và `NEST_CARDANO_NODE_SERVICE_NAME` | **Cần hỏi user** khi chọn cardano-node mode vì user tự chạy (xem PHASE 8B.1). Show gợi ý image phù hợp với version Hydra đã chọn.                                                                     |
| 8   | Cấu hình SSL/HTTPS và Nginx                                   | **Thêm là bước tuỳ chọn (Phase 13B)** — Hiển thị sau khi server khởi động thành công, hướng dẫn cài Nginx + Certbot cho production.                                                                   |

---

## 7. Tiêu chí hoàn thành (Definition of Done)

**Chức năng cốt lõi:**

- [ ] Wizard chạy end-to-end trên Ubuntu 20.04+ và 22.04+ không có lỗi
- [ ] Kiểm tra prerequisites đầy đủ (Node.js, pnpm, Docker, Docker Compose, ogmios nếu cần)
- [ ] Đưa ra hướng dẫn cụ thể khi thiếu bất kỳ prerequisite nào
- [ ] File `.env` được tạo đúng với tất cả biến cần thiết
- [ ] MySQL container được khởi động tự động qua Docker Compose
- [ ] `pnpm build && pnpm start:prod` thành công sau khi wizard hoàn thành

**Chất lượng UX:**

- [ ] Wizard có thể resume nếu bị gián đoạn giữa chừng
- [ ] Backup `.env` cũ trước khi overwrite
- [ ] Tất cả sensitive values (password, secret, API key) được ẩn `***` khi hiển thị review
- [ ] Mỗi bước có thể quay lại (`back`) để sửa câu trả lời

**cardano-node mode:**

- [ ] Hỏi đầy đủ: `NEST_CARDANO_NODE_IMAGE`, `NEST_CARDANO_NODE_SERVICE_NAME`, socket path, folder
- [ ] Kiểm tra và báo cáo trạng thái `node.socket` (tồn tại / quyền truy cập)
- [ ] Hướng dẫn cấp quyền `node.socket` khi user không có quyền
- [ ] Validate kết nối Ogmios và cảnh báo bắt buộc nếu không kết nối được
- [ ] Cảnh báo Mithril khi cardano-node chưa sync

**Bảo mật & Cấu hình:**

- [ ] Wizard hiển thị rõ lý do phải dùng `pnpm` thay vì Docker
- [ ] Thông báo rõ ràng về HUB_API_KEY sẽ nhận qua email
- [ ] `ACCOUNT_MIN_LOVELACE` được hardcode `50000000`, không hỏi user
- [ ] TX IDs hardcode đầy đủ cho tất cả version và network được hỗ trợ
- [ ] Chỉ hỗ trợ Linux — không xử lý Windows paths

**Sau khi khởi động:**

- [ ] Hướng dẫn cài Nginx + HTTPS (Phase 13B, tuỳ chọn)
- [ ] Hướng dẫn chạy seed đăng ký Provider (Phase 14)

---

_Tài liệu này là bản v1.1, đã cập nhật theo phản hồi review lần 1. Sẵn sàng để bắt đầu implement._
