# 🎯 Hexcore — User Functional Guide

> **Version**: 1.0.2  
> **Date:** October 6, 2025  
> **Authors:** Aniadev  
> **Scope:** Hướng dẫn dành cho người dùng cuối sử dụng ứng dụng/dịch vụ được xây dựng trên Hexcore

---

## 📖 Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Các khái niệm cơ bản](#2-các-khái-niệm-cơ-bản)
3. [Bắt đầu sử dụng](#3-bắt-đầu-sử-dụng)
4. [Các tính năng chính](#4-các-tính-năng-chính)
5. [Use Cases thực tế](#5-use-cases-thực-tế)
6. [Câu hỏi thường gặp (FAQ)](#6-câu-hỏi-thường-gặp-faq)
7. [Khắc phục sự cố](#7-khắc-phục-sự-cố)

---

## 1. Giới thiệu

### 1.1 Hexcore là gì?

**Hexcore** là hệ thống quản lý và triển khai **Hydra Node** trên mạng Cardano - một nền tảng hạ tầng cho phép các ứng dụng blockchain thực hiện giao dịch **nhanh hơn và rẻ hơn** thông qua công nghệ **Hydra Layer-2**.

**Vai trò của Hexcore:**
- 🔧 **Cho nhà phát triển**: Cung cấp công cụ quản lý Hydra Node clusters
- 🏢 **Cho doanh nghiệp**: Triển khai infrastructure Layer-2 cho ứng dụng của họ
- 👤 **Cho người dùng phổ thông**: Spin-up Hydra nodes để tham gia vào các DApp sử dụng Hydra
- 🌐 **Cho Provider/Node Operator**: Vận hành Hexcore để cho thuê nodes (Hydra as a Service) và kiếm thưởng

**So sánh hiệu suất:**
- ⏱️ **Blockchain thông thường (Layer-1)**: Mỗi giao dịch mất ~20 giây, phí ~0.2 ADA
- ⚡ **Hydra (Layer-2)**: Giao dịch hoàn thành ngay lập tức (<1 giây), phí gần như 0 ADA

> 💡 **Lưu ý:** Document này dành cho:
> - **Người dùng phổ thông**: Muốn tự spin-up Hydra nodes để tham gia DApp (qua Hydra Wallet hoặc DApp sử dụng Hydra SDK)
> - **Provider/Node Operator**: Muốn vận hành Hexcore để cho thuê nodes và kiếm thưởng
> - **App Users**: Sử dụng các ứng dụng được xây dựng trên Hydra (game, DApp, merchant apps...)
> 
> Nếu bạn là admin/developer muốn quản lý infrastructure hoặc tích hợp API, vui lòng xem [Admin-Operator Guide](./admin-operator-guide.md) hoặc [Developer Guide](./developer-guide.md).

### 1.2 Tại sao cần Hydra Layer-2?

**Hydra Layer-2** (được Hexcore quản lý) phù hợp cho các ứng dụng cần:
- 🎮 **Gaming**: Giao dịch item, token trong game real-time không lag
- 💰 **Micropayments**: Thanh toán số tiền nhỏ mà không lo phí cao
- 🏪 **E-commerce**: Checkout nhanh chóng như thanh toán thẻ
- 🎁 **Loyalty Programs**: Tích điểm, đổi thưởng tức thì
- 📊 **Trading Platforms**: High-frequency trading với latency thấp

### 1.3 Ai có thể dùng Hexcore?

#### **👤 Người dùng phổ thông (End Users)**
**Bạn muốn:** Tham gia vào các DApp sử dụng Hydra (game, trading, NFT marketplace...)

**Cách dùng Hexcore:**
1. Cài đặt **Hydra Wallet** (do chúng tôi cung cấp)
2. Kết nối với Hexcore để **spin-up Hydra node của riêng bạn**
3. Node này giúp bạn tham gia vào **Hydra Head** với các user khác
4. Giao dịch nhanh & rẻ trong DApp thông qua node của bạn

**Ví dụ thực tế:**
> Bạn muốn chơi game blockchain "Arena Battle". Thay vì phải setup node phức tạp, bạn chỉ cần:
> - Mở Hydra Wallet
> - Click "Join Arena Battle" 
> - Hexcore tự động tạo node cho bạn trong vài giây
> - Bắt đầu chơi ngay với giao dịch tức thì!

**Hoặc dùng qua DApp:**
- DApp đã tích hợp Hydra SDK
- Bạn kết nối ví Cardano (Nami, Eternl...)
- DApp tự động dùng Hexcore infrastructure để tạo node
- Bạn chỉ cần giao dịch, không cần biết node hoạt động thế nào

---

#### **� Người dùng Provider/Node Operator**
**Bạn có:** Server/VPS với tài nguyên mạnh, muốn kiếm thu nhập từ Cardano ecosystem

**Cách vận hành Hexcore:**
1. Setup Hexcore trên server của bạn (Docker-based)
2. Đăng ký làm **Provider** trên **Hydra Hub** (Hydra as a Service platform)
3. Hexcore của bạn sẽ chạy nhiều Hydra nodes đồng thời
4. Developers/Users thuê nodes của bạn để chạy DApp
5. Bạn nhận **thưởng** hoặc **phí thuê** theo usage

**Ví dụ kinh doanh:**
```
🖥️ Server của bạn:
- CPU: 16 cores
- RAM: 64GB
- Disk: 1TB SSD
→ Có thể chạy ~50 Hydra nodes đồng thời

💰 Doanh thu tiềm năng:
- Cho thuê mỗi node: 5-10 ADA/tháng
- 50 nodes × 8 ADA = 400 ADA/tháng
- ~$200-400 USD passive income (tùy giá ADA)

📊 Use cases:
- Game developers thuê nodes cho players
- Trading platforms thuê nodes cho traders
- DApp creators thuê nodes cho users
- Testing environments cho developers
```

**Yêu cầu kỹ thuật:**
- ✅ Server Linux (Ubuntu 22.04+)
- ✅ Docker & Docker Compose
- ✅ Public IP hoặc domain
- ✅ Ổn định 24/7 uptime
- ✅ Bandwidth tốt (minimum 100 Mbps)

**Lợi ích Provider:**
- 💰 Thu nhập thụ động từ cho thuê nodes
- 🎁 Rewards từ Hydra Hub (nếu có incentive program)
- 📈 Tăng doanh thu khi ecosystem phát triển
- 🌟 Đóng góp vào Cardano ecosystem

---

#### **🏢 Các đối tượng khác**
- 👤 **App Users**: Chỉ sử dụng ứng dụng, không cần biết Hexcore
- 🎮 **Gamers**: Chơi game với trải nghiệm mượt mà
- 💼 **Traders**: Trade NFT/tokens tốc độ cao
- 🏪 **Merchants**: Nhận thanh toán crypto nhanh chóng

### 1.4 Kiến trúc hệ thống (đơn giản hóa)

#### **Cho người dùng phổ thông:**

```
┌────────────────────────────────────────────────────────┐
│  BẠN (Người dùng phổ thông)                            │
│  ↓ Hydra Wallet hoặc Cardano Wallet                    │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  HEXCORE (Bạn tự spin-up)                              │
│  - Tạo Hydra Node của riêng bạn                        │
│  - Quản lý qua Hydra Wallet hoặc Hexcore UI            │
│  - Node giúp bạn tham gia vào DApp/Head                │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  DAPP / HYDRA HEAD                                     │
│  - Game, Trading, NFT Marketplace...                   │
│  - Giao dịch nhanh với users khác trong Head           │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  CARDANO BLOCKCHAIN (Layer-1)                          │
│  - Security & Finality                                 │
└────────────────────────────────────────────────────────┘
```

#### **Cho Provider/Node Operator:**

```
┌────────────────────────────────────────────────────────┐
│  BẠN (Provider)                                        │
│  - Setup Hexcore trên server của bạn                   │
│  - Vận hành 24/7                                       │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  HEXCORE INFRASTRUCTURE                                │
│  - Quản lý ~50 Hydra Nodes                             │
│  - Dockerized, scalable                                │
│  - PostgreSQL, Redis, NestJS Backend                   │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  HYDRA HUB (Hydra as a Service)                        │
│  - Marketplace cho thuê nodes                          │
│  - Developers/Users thuê node của bạn                  │
│  - Payment & reward system                             │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  END USERS / DAPPS                                     │
│  - Dùng nodes bạn cung cấp                             │
│  - Giao dịch trong DApps của họ                        │
└────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────┐
│  CARDANO BLOCKCHAIN                                    │
│  - Settlement layer                                    │
└────────────────────────────────────────────────────────┘
```

**Giải thích:**
1. **Người dùng phổ thông**: Tự tạo node qua Hexcore để join DApp
2. **Provider**: Vận hành Hexcore infrastructure, cho thuê nodes qua Hydra Hub
3. **DApp/Users**: Thuê nodes từ Provider hoặc tự spin-up
4. **Cardano blockchain**: Đảm bảo an toàn cuối cùng

---

## 2. Các khái niệm cơ bản

### 2.1 🌐 Blockchain (Layer-1)

**Blockchain** là sổ cái công khai ghi lại tất cả giao dịch. Mọi người đều có thể kiểm tra và xác minh.

**Ví dụ thực tế:**
> Giống như một cuốn sổ kế toán mà ai cũng có thể xem và kiểm tra, nhưng không ai có thể xóa hoặc sửa.

**Cardano blockchain:**
- ✅ An toàn tuyệt đối
- ✅ Minh bạch 100%
- ❌ Chậm hơn (~20 giây/giao dịch)
- ❌ Phí cao hơn (~0.2 ADA)

### 2.2 ⚡ Hydra Head (Layer-2)

**Hydra Head** là một "phòng giao dịch riêng" nằm ngoài blockchain chính, cho phép:
- Giao dịch **cực nhanh** (ngay lập tức)
- Phí **gần như 0**
- Vẫn **an toàn** như blockchain chính

**Ví dụ thực tế:**
> Giống như bạn và bạn bè mở một "ví chung" để chia tiền ăn uống trong chuyến đi. Mọi người giao dịch với nhau thoải mái, chỉ cần ghi chép lại. Khi kết thúc chuyến đi, mới tính toán tổng và chuyển tiền thật một lần duy nhất.

**Cách hoạt động:**
```
1. 🔓 Mở Head: Mọi người bỏ tiền vào "ví chung"
2. ⚡ Giao dịch: Mọi người tự do giao dịch với nhau trong Head
3. 🔒 Đóng Head: Tính toán số dư cuối cùng và ghi lên blockchain
```

### 2.3 👥 Participants (Người tham gia)

**Participants** là những người tham gia vào một Hydra Head.

**Ví dụ:**
- Trong một game, 5 người chơi có thể tạo một Head để trao đổi item
- Trong ứng dụng loyalty, merchant và khách hàng tạo Head để tích điểm

**Quy tắc:**
- Tối thiểu: **2 người**
- Tối đa: **Không giới hạn** (nhưng khuyến nghị 5-10 người để tối ưu)
- Tất cả participants phải **đồng ý** khi mở và đóng Head

### 2.4 💰 Commit (Ký gửi)

**Commit** là hành động bỏ tiền (ADA hoặc token) vào Hydra Head để có thể giao dịch.

**Ví dụ thực tế:**
> Giống như bạn nạp tiền vào tài khoản game trước khi mua item. Số tiền này bị "khóa" trong game và chỉ dùng được trong game đó.

**Quy trình:**
1. Bạn có **100 ADA** trong ví
2. Bạn **commit 50 ADA** vào Head
3. Giờ bạn có:
   - **50 ADA** trong ví (dùng bình thường)
   - **50 ADA** trong Head (chỉ dùng trong Head)

**⚠️ Lưu ý:**
- Tiền commit **không mất đi**, chỉ tạm thời không dùng được ngoài Head
- Khi đóng Head, bạn sẽ nhận lại đúng số dư cuối cùng

### 2.5 📸 Snapshot (Ảnh chụp trạng thái)

**Snapshot** là bức ảnh chụp trạng thái số dư của tất cả mọi người tại một thời điểm.

**Ví dụ thực tế:**
> Giống như bạn chụp ảnh bảng điểm của cả lớp sau mỗi bài kiểm tra để lưu lại kết quả.

**Tại sao cần Snapshot?**
- Ghi nhận ai có bao nhiêu tiền
- Đảm bảo không ai gian lận
- Khôi phục nếu có sự cố

**Quy trình:**
```
Giao dịch 1 → Snapshot 1 (A: 80 ADA, B: 20 ADA)
Giao dịch 2 → Snapshot 2 (A: 70 ADA, B: 30 ADA)
Giao dịch 3 → Snapshot 3 (A: 60 ADA, B: 40 ADA)
```

### 2.6 🚪 Fanout (Rút tiền về)

**Fanout** là hành động đóng Head và trả tiền về cho mọi người theo số dư cuối cùng.

**Ví dụ thực tế:**
> Kết thúc chuyến đi, mọi người tính toán xem ai còn nợ ai, rồi chuyển tiền thật cho nhau.

**Quy trình:**
1. **Đóng Head**: Tất cả mọi người đồng ý đóng
2. **Fanout**: Hệ thống ghi số dư cuối cùng lên blockchain
3. **Nhận tiền**: Mỗi người nhận đúng số dư của mình về ví

**⏱️ Thời gian:**
- Giao dịch fanout mất ~20-30 giây (ghi lên blockchain)
- Sau đó tiền sẽ xuất hiện trong ví của bạn

### 2.7 🔐 Node (Điểm kết nối)

**Node** là một "máy chủ" Hydra chạy trong Docker container, giúp kết nối và tương tác với Hydra Head. Trong Hexcore:

**Từ góc độ người dùng:**
> Giống như router Wi-Fi ở nhà bạn, giúp bạn kết nối internet. Bạn không cần biết router hoạt động thế nào, chỉ cần kết nối và dùng.

**Từ góc độ kỹ thuật (FYI):**
- Mỗi Hydra Node là một Docker container được Hexcore quản lý
- Admin sử dụng **Hexcore UI** để tạo, bật/tắt, cấu hình nodes
- Nodes được gắn với **wallet accounts** để tham gia vào Hydra Heads
- Hexcore Backend (NestJS) điều khiển Docker containers qua Dockerode API

**Người dùng không cần quan tâm node**, ứng dụng sẽ tự động kết nối đến node cluster được admin thiết lập sẵn.

### 2.8 📊 Head Status (Trạng thái Head)

| Trạng thái | Ý nghĩa | Bạn có thể làm gì? | Admin phải làm gì? |
|------------|---------|-------------------|-------------------|
| **Idle** | Chưa khởi tạo | Chưa có gì | Admin cần start head từ Hexcore UI |
| **Initializing** | Đang mở Head | Đợi mọi người commit | Đảm bảo nodes đang chạy |
| **Open** | Head đang hoạt động | ✅ Giao dịch tự do | Monitor trạng thái |
| **Closed** | Head đã đóng | Chờ fanout | Xử lý fanout transaction |
| **Final** | Đã fanout xong | Đã nhận tiền về | Clean up resources |

**Quy trình quản lý Head (Backend):**
1. **Admin tạo nodes** trong Hexcore UI → Lưu config vào PostgreSQL
2. **Admin ghép nodes thành Head** → Hexcore start các containers
3. **Users commit funds** → Head chuyển sang Open
4. **Users transact** → Nodes xử lý và sync snapshots
5. **Users/Admin đóng Head** → Fanout, funds về ví users

### 2.9 💾 Hexcore Backend Components (Optional - Advanced)

Để hiểu hơn về infrastructure, đây là các thành phần chính:

| Component | Vai trò | Người dùng thấy gì? |
|-----------|---------|-------------------|
| **Hexcore UI** | Web app quản trị nodes | Admin dùng để quản lý |
| **NestJS Backend** | API server, điều khiển Docker | Transparent, chạy ngầm |
| **PostgreSQL** | Lưu config nodes, wallets, heads | Transparent |
| **Docker Engine** | Chạy Hydra node containers | Transparent |
| **Hydra Nodes** | Xử lý giao dịch Layer-2 | App kết nối tới đây |
| **Cardano Node** | Blockchain Layer-1 | Settlement cuối cùng |

> 💡 **Mẹo:** Bạn không cần hiểu chi tiết các thành phần này. Chỉ cần biết rằng Hexcore quản lý toàn bộ infrastructure để ứng dụng của bạn có thể giao dịch nhanh và rẻ!

---

## 3. Bắt đầu sử dụng

### 3.1 Chuẩn bị

#### **Path A: Người dùng phổ thông (Spin-up own node)**

**Bước 1: Cài đặt Hydra Wallet hoặc Cardano Wallet**

**Option 1: Hydra Wallet** (Recommended - Tích hợp sẵn Hexcore)
- Download: [Link to Hydra Wallet] (Coming soon)
- Hỗ trợ: Browser extension + Mobile app
- Tính năng: Auto spin-up node, join Head tự động

**Option 2: Cardano Wallets thông thường**
- **Nami**: [namiwallet.io](https://namiwallet.io) ⭐⭐⭐⭐⭐ Dễ dùng
- **Eternl**: [eternl.io](https://eternl.io) ⭐⭐⭐⭐⭐ Nhiều tính năng
- **Lace**: [lace.io](https://lace.io) ⭐⭐⭐⭐ Giao diện đẹp

**Bước 2: Kết nối với Hexcore**

Nếu dùng **Hydra Wallet**:
```
1. Mở Hydra Wallet
2. Click "Create Hydra Node" 
3. Chọn DApp bạn muốn tham gia (hoặc create own)
4. Wallet tự động spin-up node cho bạn (~30 giây)
5. ✅ Node sẵn sàng! Bạn có thể join Head
```

Nếu dùng **Cardano Wallet** + DApp có Hydra SDK:
```
1. Truy cập DApp (game, marketplace...)
2. Click "Connect Wallet"
3. DApp sẽ yêu cầu tạo Hydra Node
4. Approve → DApp dùng Hexcore để tạo node cho bạn
5. ✅ Ready to transact!
```

**Bước 3: Nạp ADA vào ví**

**Testnet (Thử nghiệm miễn phí):**
- Faucet: https://docs.cardano.org/cardano-testnets/tools/faucet/
- Nhận 1000 tADA miễn phí

**Mainnet (Thật):**
- Mua ADA từ sàn (Binance, Coinbase...)
- Rút về địa chỉ ví

---

#### **Path B: Provider/Node Operator**

**Bước 1: Chuẩn bị server**

**Yêu cầu tối thiểu:**
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 cores | 16 cores |
| RAM | 32GB | 64GB |
| Disk | 500GB SSD | 1TB NVMe SSD |
| Network | 50 Mbps | 100+ Mbps |
| OS | Ubuntu 22.04 | Ubuntu 22.04 LTS |

**Bước 2: Cài đặt Hexcore**

```bash
# Clone repository
git clone https://github.com/your-org/hexcore.git
cd hexcore

# Setup environment
cp .env.example .env
nano .env  # Chỉnh sửa config

# Start services
docker-compose up -d

# Check status
docker ps
```

**Bước 3: Đăng ký Provider trên Hydra Hub**

```
1. Truy cập Hydra Hub: https://hub.hydra.family
2. Click "Become a Provider"
3. Điền thông tin:
   - Server specs
   - Pricing (ADA/node/month)
   - Contact info
4. Submit verification
5. Chờ approval (~1-2 ngày)
```

**Bước 4: Configure payment**

```
# Setup wallet để nhận payment
hexcore-cli wallet create --type provider

# Set pricing
hexcore-cli pricing set --node-price 8 --currency ADA

# Enable auto-billing
hexcore-cli billing enable
```

**Bước 5: Monitor & maintain**

- 📊 Dashboard: `http://your-server:3010/admin`
- 📈 Metrics: `http://your-server:9090` (Prometheus)
- 🔔 Alerts: Setup Discord/Telegram webhooks

---

#### **Path C: App User (Passive usage)**

#### **Path C: App User (Passive usage)**

Nếu bạn chỉ muốn dùng app, không quan tâm node:

**Bước 1: Cài ví Cardano**
- Nami, Eternl, Lace (bất kỳ ví nào)

**Bước 2: Nạp ADA**
- Testnet: Faucet miễn phí
- Mainnet: Mua từ sàn

**Bước 3: Connect & Play**
- Mở DApp → Connect wallet → Bắt đầu dùng
- Node được quản lý tự động (bởi DApp hoặc Provider)

---

### 3.2 Giao diện cơ bản

#### **Cho người dùng phổ thông (với own node):**

```
┌─────────────────────────────────────────────────────────┐
│  🏠 My Hydra Node Dashboard                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🖥️ My Node Status:                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Node ID: hydra-node-abc123                      │   │
│  │ Status: 🟢 Running                              │   │
│  │ Uptime: 3 days 5 hours                          │   │
│  │ Peers: 4 connected                              │   │
│  │ [View Logs] [Restart] [Stop]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💰 Wallet Balance: 100 ADA                            │
│  ⚡ Active Heads: 2                                     │
│                                                         │
│  📊 My Heads:                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎮 Game Arena #123                              │   │
│  │ Status: Open | Balance: 50 ADA                  │   │
│  │ [View Details] [Exit Head]                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🖼️ NFT Trading Room #42                         │   │
│  │ Status: Open | Balance: 30 ADA                  │   │
│  │ [View Details] [Exit Head]                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🔔 Recent Transactions:                                │
│  • Sent 5 ADA to Alice (2 seconds ago) ✅              │
│  • Received 10 ADA from Bob (1 minute ago) ✅          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### **Cho Provider/Node Operator:**

```
┌─────────────────────────────────────────────────────────┐
│  🌐 Provider Dashboard - Hexcore Infrastructure         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Infrastructure Status:                              │
│  • Total Nodes: 47 / 50 (94% utilization)              │
│  • Running: 45 🟢 | Stopped: 2 ⚪                       │
│  • CPU Usage: 68% | RAM: 42GB / 64GB                   │
│  • Network: 85 Mbps ↓ / 45 Mbps ↑                      │
│                                                         │
│  💰 Revenue (This Month):                               │
│  • Rented Nodes: 45 nodes × 8 ADA = 360 ADA           │
│  • Rewards: +40 ADA (Hydra Hub bonus)                  │
│  • Total: 400 ADA (~$200 USD)                          │
│                                                         │
│  👥 Clients:                                            │
│  • Active: 23 | Total: 67                              │
│  • Top clients: GameDev123 (10 nodes), TradingPro (8)  │
│                                                         │
│  📈 Performance:                                        │
│  • Uptime: 99.8% (Last 30 days)                        │
│  • Avg response time: 45ms                              │
│  • Total transactions: 1.2M                             │
│                                                         │
│  [Add More Nodes] [View Analytics] [Settings]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Các tính năng chính

### 4.1 🚀 Tham gia Hydra Head

#### **Scenario: Tham gia game multiplayer**

**Bước 1: Nhận lời mời**
- Game sẽ tự động tạo Head khi bạn join room
- Hoặc bạn có thể tạo Head mới và mời bạn bè

**Bước 2: Commit tiền**

```
┌─────────────────────────────────────────────┐
│  💰 Commit to Head                          │
├─────────────────────────────────────────────┤
│  Game: Arena Battle #123                    │
│  Entry fee: 10 ADA                          │
│                                             │
│  Your wallet: 100 ADA                       │
│  Amount to commit: [10] ADA                 │
│                                             │
│  ⚠️ This amount will be locked in the head │
│  You can withdraw when the game ends        │
│                                             │
│  [Cancel]  [Commit & Join] ✅               │
└─────────────────────────────────────────────┘
```

**Bước 3: Chờ mọi người sẵn sàng**
- Head sẽ mở khi tất cả participants đã commit
- Thường mất 1-2 phút

**Bước 4: Head mở thành công!**
```
✅ Head is now OPEN!
⚡ You can now transact instantly with 0 fees
🎮 Game started!
```

### 4.2 ⚡ Giao dịch trong Head

Khi Head đã mở, mọi giao dịch đều **ngay lập tức** và **miễn phí**.

#### **Ví dụ 1: Mua item trong game**

```
┌─────────────────────────────────────────────┐
│  🛒 Buy Item                                │
├─────────────────────────────────────────────┤
│  Item: Legendary Sword ⚔️                   │
│  Price: 5 ADA                               │
│  Seller: Alice                              │
│                                             │
│  Your balance: 50 ADA → 45 ADA             │
│                                             │
│  Transaction fee: 0 ADA (FREE!) 🎉          │
│  Confirmation time: Instant ⚡              │
│                                             │
│  [Cancel]  [Buy Now] ✅                     │
└─────────────────────────────────────────────┘
```

Click **"Buy Now"** → Item xuất hiện ngay lập tức trong inventory!

#### **Ví dụ 2: Chuyển tiền cho bạn**

```
┌─────────────────────────────────────────────┐
│  💸 Send ADA                                │
├─────────────────────────────────────────────┤
│  To: Bob                                    │
│  Amount: [20] ADA                           │
│  Message: "Thanks for helping me!"          │
│                                             │
│  Your balance: 45 ADA → 25 ADA             │
│                                             │
│  Fee: FREE ⚡                                │
│  Speed: Instant (< 1 second)                │
│                                             │
│  [Cancel]  [Send] ✅                        │
└─────────────────────────────────────────────┘
```

### 4.3 📊 Xem trạng thái và lịch sử

#### **Dashboard Overview:**

```
┌─────────────────────────────────────────────────────────┐
│  📊 Head Details: Game Arena #123                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Status: 🟢 OPEN                                        │
│  Duration: 15 minutes                                   │
│  Total transactions: 127                                │
│                                                         │
│  👥 Participants (5):                                   │
│  • You: 25 ADA                                          │
│  • Alice: 55 ADA                                        │
│  • Bob: 30 ADA                                          │
│  • Charlie: 40 ADA                                      │
│  • Dave: 50 ADA                                         │
│                                                         │
│  📈 Transaction History:                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 12:35:42 - You → Alice: 5 ADA (Buy Sword)      │   │
│  │ 12:34:15 - Bob → You: 20 ADA (Gift)            │   │
│  │ 12:32:01 - You → Bob: 10 ADA (Trade)           │   │
│  │ 12:30:00 - Head opened                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Refresh] [Exit Head] [Export History]                │
└─────────────────────────────────────────────────────────┘
```

### 4.4 🚪 Rời khỏi Head (Exit/Fanout)

Khi bạn muốn rút tiền về ví chính:

#### **Option 1: Đóng Head (Close)**

**Điều kiện:** Tất cả participants phải đồng ý

```
┌─────────────────────────────────────────────┐
│  🚪 Close Head                              │
├─────────────────────────────────────────────┤
│  Head: Game Arena #123                      │
│                                             │
│  Your current balance: 25 ADA               │
│  You will receive: 25 ADA                   │
│                                             │
│  ⚠️ All participants must agree to close   │
│  🕐 Fanout will take ~30 seconds            │
│                                             │
│  Votes:                                     │
│  ✅ You                                     │
│  ✅ Alice                                   │
│  ✅ Bob                                     │
│  ⏳ Charlie (waiting...)                    │
│  ⏳ Dave (waiting...)                       │
│                                             │
│  [Cancel]  [Vote to Close] ✅               │
└─────────────────────────────────────────────┘
```

#### **Option 2: Timeout (Tự động đóng)**

Nếu có người không phản hồi, Head sẽ tự động đóng sau thời gian timeout (thường 1-24 giờ).

#### **Bước fanout:**

```
┌─────────────────────────────────────────────┐
│  ⏳ Fanout in progress...                   │
├─────────────────────────────────────────────┤
│  Step 1: Closing head... ✅                 │
│  Step 2: Creating fanout transaction... ✅  │
│  Step 3: Submitting to blockchain... ⏳     │
│  Step 4: Waiting for confirmation... ⏳     │
│                                             │
│  Estimated time: 20-30 seconds              │
│                                             │
│  💡 You can close this window, we'll notify│
│     you when funds arrive in your wallet    │
└─────────────────────────────────────────────┘
```

**Kết quả:**
```
✅ Fanout completed successfully!
💰 25 ADA has been returned to your wallet
🔔 Check your wallet to confirm
```

### 4.5 🔔 Notifications (Thông báo)

Ứng dụng sẽ thông báo cho bạn khi:

| Sự kiện | Thông báo | Hành động |
|---------|-----------|-----------|
| 💰 Nhận tiền | "You received 10 ADA from Alice" | Xem chi tiết |
| 🚀 Head mở | "Head #123 is now open!" | Bắt đầu giao dịch |
| 📸 Snapshot | "New snapshot confirmed" | Không cần làm gì |
| 🚪 Vote to close | "Bob wants to close the head" | Vote đồng ý/từ chối |
| ✅ Fanout xong | "25 ADA returned to your wallet" | Check ví |
| ⚠️ Lỗi | "Transaction failed: insufficient funds" | Kiểm tra số dư |

---

## 5. Use Cases thực tế

### 5.1 🎮 Use Case 1: Game Blockchain

#### **Scenario: Arena Battle Game**

**Bối cảnh:**
- Game PvP 5 người
- Mỗi người đặt cược 10 ADA
- Người thắng nhận toàn bộ pot (50 ADA)

**Quy trình:**

**1️⃣ Lobby (Phòng chờ)**
```
┌─────────────────────────────────────────────┐
│  🎮 Arena Battle - Room #123                │
├─────────────────────────────────────────────┤
│  Players: 4/5                               │
│  Entry fee: 10 ADA                          │
│  Prize pool: 50 ADA                         │
│                                             │
│  Waiting for:                               │
│  • Alice ✅                                 │
│  • Bob ✅                                   │
│  • Charlie ✅                               │
│  • You ✅                                   │
│  • Dave ⏳ (joining...)                     │
│                                             │
│  [Leave Room] [Invite Friend]               │
└─────────────────────────────────────────────┘
```

**2️⃣ Commit Phase**
```
Dave joined! All players ready.
💰 Please commit 10 ADA to join the game.

[Commit 10 ADA] ✅
```

**3️⃣ Game Started**
```
⚡ Hydra Head is OPEN!
🎮 Game started!
⏱️ Round 1/3

During game:
• Buy power-ups: 2 ADA ⚡
• Trade items with other players
• All transactions are instant & free!
```

**4️⃣ Game Ends**
```
🏆 Winner: Alice!

Prize distribution:
• Alice: 50 ADA (winner)
• You: 0 ADA (eliminated)

🚪 Head will close in 10 seconds...
✅ Fanout completed!
💰 Check your wallet for final balance
```

**Lợi ích của Hydra:**
- ✅ Giao dịch trong game **ngay lập tức** (không lag)
- ✅ Mua item, trade **không mất phí**
- ✅ Fair play (tất cả đều ghi trên blockchain)
- ✅ Rút thắng về ví sau game (~30 giây)

### 5.2 💳 Use Case 2: Micropayments Platform

#### **Scenario: Coffee Shop Loyalty Program**

**Bối cảnh:**
- Quán cà phê chấp nhận thanh toán ADA
- Khách tích điểm mỗi lần mua
- Đổi điểm lấy đồ uống miễn phí

**Quy trình:**

**1️⃣ First Visit (Lần đầu ghé quán)**
```
☕ Welcome to Cardano Coffee!

[Create Loyalty Account] ✅

Commit 20 ADA to your loyalty wallet:
• Get instant rewards
• Zero transaction fees
• Redeem anytime

[Commit 20 ADA] ✅
```

**2️⃣ Order Coffee**
```
┌─────────────────────────────────────────────┐
│  ☕ Order                                    │
├─────────────────────────────────────────────┤
│  1x Cappuccino: 2 ADA                       │
│  1x Croissant: 1.5 ADA                      │
│                                             │
│  Subtotal: 3.5 ADA                          │
│  Loyalty points: +35 points 🎉              │
│                                             │
│  Your balance: 20 ADA → 16.5 ADA           │
│                                             │
│  [Pay with Hydra] ⚡ Instant & FREE         │
└─────────────────────────────────────────────┘
```

**✅ Payment confirmed in < 1 second!**

**3️⃣ Accumulate Points**
```
📊 Your Loyalty Status:

Total spent: 12.5 ADA
Points earned: 125 points
Remaining balance: 7.5 ADA

Rewards available:
🎁 Free coffee (100 points) - AVAILABLE!
🎁 Free lunch combo (500 points) - 375 more

[Redeem Free Coffee] ✅
```

**4️⃣ Redeem Reward**
```
🎉 Congratulations!

You redeemed: Free Cappuccino
Points used: -100 points
Remaining: 25 points

Your free coffee is ready! ☕
```

**5️⃣ Cash Out (Rút tiền về)**
```
💰 Withdraw Funds

Current balance: 7.5 ADA
Withdraw to wallet: [7.5] ADA

Note: This will close your loyalty Head
You can rejoin anytime!

[Withdraw] ✅

⏳ Processing fanout... (~30 seconds)
✅ Done! 7.5 ADA returned to your wallet
```

**Lợi ích:**
- ✅ Thanh toán **tức thì** (không chờ đợi)
- ✅ Không mất **phí giao dịch**
- ✅ Tích điểm **real-time**
- ✅ Linh hoạt rút tiền về bất kỳ lúc nào

### 5.3 🎁 Use Case 3: NFT Marketplace

#### **Scenario: Fast NFT Trading**

**Bối cảnh:**
- Trading NFTs giữa collectors
- Cần giao dịch nhanh để "snipe" deals tốt
- Phí gas cao làm giảm profit

**Quy trình:**

**1️⃣ Join Trading Head**
```
🖼️ NFT Trading Room #42

Active traders: 12
Total volume: 1,250 ADA
Active listings: 47 NFTs

Commit funds to start trading:
Recommended: 100 ADA

[Commit & Start Trading] ✅
```

**2️⃣ Browse & Buy**
```
┌─────────────────────────────────────────────┐
│  🖼️ NFT Listing                             │
├─────────────────────────────────────────────┤
│  [Image: Cardano Monkey #1234]              │
│                                             │
│  Collection: Cardano Monkeys                │
│  Rarity: Legendary                          │
│  Owner: Alice                               │
│                                             │
│  Price: 45 ADA                              │
│  Floor price: 50 ADA (10% discount!) 🔥     │
│                                             │
│  ⚡ Instant purchase (no gas fees!)         │
│                                             │
│  [Buy Now] ✅                               │
└─────────────────────────────────────────────┘
```

**Click "Buy Now" → NFT chuyển về ví ngay lập tức!**

**3️⃣ Flip for Profit**
```
You bought: Cardano Monkey #1234 for 45 ADA

Now listing for: 55 ADA
Expected profit: 10 ADA 💰

[List for Sale] ✅

⏳ Waiting for buyer...
✅ SOLD to Bob for 55 ADA!

Profit: +10 ADA 🎉
```

**4️⃣ Mass Trading**
```
📊 Your Trading Session:

Duration: 2 hours
Trades: 8
Total bought: 360 ADA
Total sold: 405 ADA
Net profit: +45 ADA 💰

Gas fees saved: ~1.6 ADA (compared to L1)

[Continue Trading] [Exit & Withdraw] ✅
```

**Lợi ích:**
- ✅ Snipe deals **nhanh hơn** (no lag)
- ✅ Tiết kiệm **phí gas** (~0.2 ADA/trade trên L1)
- ✅ Flip nhiều lần mà không lo phí
- ✅ Withdraw profit về ví một lần duy nhất

### 5.4 🏪 Use Case 4: E-commerce Checkout

#### **Scenario: Online Store với Crypto Payment**

**Bối cảnh:**
- Cửa hàng online bán đồ điện tử
- Khách hàng muốn thanh toán bằng ADA
- Cần checkout nhanh như Visa/Mastercard

**Quy trình:**

**1️⃣ Shopping Cart**
```
🛒 Your Cart:

• Wireless Mouse: 15 ADA
• Keyboard: 35 ADA
• USB Cable: 2 ADA

Subtotal: 52 ADA
Shipping: 3 ADA
Total: 55 ADA

Payment method:
○ Credit Card (3% fee)
● Cardano Hydra (INSTANT, 0% fee!) ⚡

[Checkout with Hydra] ✅
```

**2️⃣ Quick Commit**
```
💳 Hydra Checkout

This merchant uses Hydra for instant payments!

You'll commit: 55 ADA
Merchant: ElectroShop
Order: #78234

✅ Funds protected until delivery confirmed
✅ Automatic refund if order cancelled

[Commit & Pay] ✅

⚡ Payment confirmed instantly!
📧 Order confirmation sent to your email
```

**3️⃣ Order Tracking**
```
📦 Order #78234

Status: Shipped 🚚
Tracking: ADA-2025-10-06-78234

Estimated delivery: Oct 10, 2025

Payment status:
✅ 55 ADA locked in escrow
💡 Will be released to merchant upon delivery

[Track Package] [Contact Support]
```

**4️⃣ Delivery Confirmation**
```
✅ Order Delivered!

📦 Package received: Oct 9, 2025
Rating: ⭐⭐⭐⭐⭐

Payment released:
• 55 ADA transferred to merchant
• Head automatically closed
• Transaction complete!

Thank you for using Cardano Hydra! 🎉

[Leave Review] [Browse More Products]
```

**Lợi ích:**
- ✅ Checkout **nhanh như thẻ tín dụng**
- ✅ Không mất **phí merchant** (3-5% với card)
- ✅ Bảo vệ người mua (escrow tự động)
- ✅ Hoàn tiền dễ dàng nếu có vấn đề

---

## 6. Câu hỏi thường gặp (FAQ)

### 6.1 💰 Về tiền và an toàn

**Q: Tiền của tôi có an toàn không khi commit vào Head?**

A: **Có, rất an toàn!** 
- Tiền được bảo vệ bởi **smart contracts** trên Cardano blockchain
- Ngay cả khi server bị tấn công, tiền của bạn **không thể bị đánh cắp**
- Bạn luôn có thể **rút tiền về** khi cần (thông qua fanout)

**Q: Nếu ai đó trong Head không trung thực thì sao?**

A: Không sao cả! 
- Mọi giao dịch đều cần **chữ ký điện tử** của bạn
- Không ai có thể chuyển tiền của bạn mà không có sự đồng ý
- Snapshot được **tất cả mọi người xác nhận**, không thể gian lận

**Q: Nếu mất điện/mất mạng giữa chừng thì sao?**

A: Tiền của bạn vẫn an toàn!
- State được lưu trên **blockchain**
- Khi bạn online lại, số dư vẫn đúng
- Nếu Head timeout, hệ thống tự động fanout cho bạn

### 6.2 ⚡ Về tốc độ và phí

**Q: Giao dịch trong Head nhanh như thế nào?**

A: **Gần như tức thì!**
- Giao dịch thông thường: < 1 giây
- So với blockchain (Layer-1): ~20 giây
- So với Bitcoin: ~10 phút
- So với Ethereum: ~15 giây

**Q: Có phí giao dịch không?**

A: **Gần như miễn phí!**
- Trong Head: **0 ADA** (không có phí)
- Mở Head: ~0.2-0.5 ADA (phí L1)
- Đóng Head (fanout): ~0.2-0.5 ADA (phí L1)
- Ví dụ: Giao dịch 100 lần trong Head, chỉ mất tổng ~1 ADA phí

**Q: Bao nhiêu giao dịch thì nên dùng Hydra?**

A: **Từ 3 giao dịch trở lên là có lợi**
- 1 giao dịch L1: 0.2 ADA
- 3 giao dịch L1: 0.6 ADA
- 100 giao dịch Hydra: ~1 ADA (phí mở + đóng)

### 6.3 🔧 Về kỹ thuật

**Q: Tôi có thể dùng Hydra trên điện thoại không?**

A: **Có!**
- Cài ví Cardano hỗ trợ mobile (Eternl, Yoroi)
- Truy cập DApp qua mobile browser
- Trải nghiệm tương tự desktop

**Q: Hydra có hoạt động trên mainnet không?**

A: **Có!** (từ phiên bản 0.15.0+)
- Mainnet đã ready
- Testnet/Preprod để thử nghiệm miễn phí
- Ứng dụng sẽ cho biết đang dùng mạng nào

**Q: Tôi có thể tham gia nhiều Head cùng lúc không?**

A: **Có!**
- Mỗi Head độc lập
- Tiền trong Head A không dùng được trong Head B
- Dashboard sẽ hiện tất cả Heads bạn tham gia

**Q: Head có giới hạn thời gian không?**

A: **Tùy ứng dụng:**
- Game: thường đóng khi game kết thúc
- E-commerce: đóng khi giao hàng xong
- Trading: có thể để mở nhiều giờ/ngày
- Có cơ chế **timeout** tự động nếu không ai đóng

**Q: Hexcore chạy trên infrastructure nào?**

A: **Docker-based infrastructure:**
- Mỗi Hydra node chạy trong Docker container
- Admin quản lý qua Hexcore UI (Web app)
- Backend NestJS điều khiển Docker Engine
- PostgreSQL lưu trữ cấu hình và trạng thái
- Hỗ trợ ≥50 nodes cùng lúc

**Q: Làm sao biết ứng dụng tôi dùng có sử dụng Hexcore không?**

A: **Các dấu hiệu:**
- Giao dịch cực nhanh (< 1 giây)
- Phí giao dịch gần như 0
- Có thể thấy mention "Powered by Hexcore" hoặc "Using Hydra Layer-2"
- Developer/admin sẽ thông báo infrastructure họ dùng

**Q: Tôi có thể spin-up node của riêng mình không?**

A: **Có! (Với Hydra Wallet hoặc Hexcore access):**
- Dùng Hydra Wallet: Tự động spin-up node trong vài giây
- Hoặc DApp tích hợp Hydra SDK: DApp tạo node cho bạn
- Node chạy trên Hexcore infrastructure (managed hoặc self-hosted)
- Bạn có full control để join/leave Heads

**Q: Node của tôi chạy ở đâu?**

A: **Có 2 options:**
1. **Managed by Provider**: Node chạy trên server của Provider (Hydra as a Service)
   - Bạn thuê node, không cần lo về hardware
   - Phí: 5-10 ADA/tháng
   
2. **Self-hosted**: Bạn tự setup Hexcore trên server của mình
   - Full control, không phí thuê
   - Cần kiến thức kỹ thuật + server

**Q: Provider kiếm tiền từ đâu?**

A: **Nhiều nguồn:**
- 💰 **Rental fees**: Users thuê nodes (5-10 ADA/node/tháng)
- 🎁 **Rewards**: Hydra Hub trả thưởng cho uptime tốt
- 📈 **Premium services**: SLA cao hơn, support 24/7
- 🤝 **Partnerships**: Deals với game studios, DApp developers

**Q: Làm Provider có lãi không?**

A: **Có thể:**
- Server 64GB RAM, 16 cores → Chạy ~50 nodes
- 50 nodes × 8 ADA/tháng = 400 ADA (~$200-400 USD)
- Trừ chi phí server (~$50-100/tháng) = Profit ~$150-350/tháng
- ROI phụ thuộc vào số lượng users thuê nodes

### 6.4 🎮 Về sử dụng

**Q: Tôi có thể rút tiền bất kỳ lúc nào không?**

A: **Phần nào:**
- **Không thể rút giữa chừng** (Head phải đóng mới fanout được)
- **Có thể vote đóng Head** bất kỳ lúc nào
- Nếu mọi người đồng ý → Head đóng → Bạn nhận tiền về
- Nếu có timeout → Head tự đóng sau thời gian quy định

**Q: Nếu ai đó không vote đóng Head thì sao?**

A: Có cơ chế **timeout**:
- Sau X giờ không hoạt động → Head tự động đóng
- Ứng dụng sẽ cảnh báo trước
- Bạn vẫn nhận đúng số dư của mình

**Q: Tôi có thể thêm tiền vào Head đang mở không?**

A: **Hiện tại chưa hỗ trợ** (roadmap future):
- Phải commit đủ tiền từ đầu
- Muốn thêm → Phải đóng Head và mở lại
- Version sau sẽ có tính năng "incremental commit"

**Q: NFT có thể dùng trong Hydra không?**

A: **Có!**
- NFTs là native tokens trên Cardano
- Có thể commit NFT vào Head
- Trade NFT trong Head với tốc độ cao
- Fanout để rút NFT về ví

---

## 7. Khắc phục sự cố

### 7.1 🔴 Lỗi thường gặp

#### **Error 1: "Insufficient funds"**

**Nguyên nhân:** Không đủ ADA trong ví

**Giải pháp:**
1. Kiểm tra số dư ví: Cần có ít nhất **commit amount + 2 ADA** (để trả phí)
2. Nạp thêm ADA vào ví
3. Thử lại

#### **Error 2: "Transaction failed: wallet not connected"**

**Nguyên nhân:** Ví chưa kết nối hoặc mất kết nối

**Giải pháp:**
1. Refresh trang web
2. Click **"Connect Wallet"** lại
3. Approve trong popup ví
4. Nếu vẫn lỗi: Thử browser khác hoặc tắt ad-blocker

#### **Error 3: "Head initialization timeout"**

**Nguyên nhân:** Có người chưa commit trong thời gian quy định

**Giải pháp:**
1. Đợi thêm vài phút
2. Liên hệ người chưa commit (nếu biết)
3. Admin có thể cancel và mở Head mới
4. Tiền commit sẽ tự động hoàn lại

#### **Error 4: "Cannot close head: participant offline"**

**Nguyên nhân:** Có người offline, không thể vote đóng

**Giải pháp:**
1. Đợi timeout (thường 1-24 giờ)
2. Head sẽ tự động đóng
3. Bạn vẫn nhận được tiền của mình
4. Không cần làm gì cả, chờ thôi

#### **Error 5: "Snapshot confirmation failed"**

**Nguyên nhân:** Mạng không ổn định hoặc conflict data

**Giải pháp:**
1. Refresh trang
2. Thử giao dịch lại
3. Nếu vẫn lỗi: Liên hệ support
4. Snapshot cuối cùng luôn là đúng, đừng lo

### 7.2 🛠️ Kiểm tra và khắc phục

#### **Checklist khi gặp vấn đề:**

- [ ] 1. **Check wallet connection**
  ```
  Wallet connected: ✅ / ❌
  Network: Mainnet / Preprod / Testnet
  Balance: XXX ADA
  ```

- [ ] 2. **Check Head status**
  ```
  Head ID: #123
  Status: Initializing / Open / Closed / Final
  Your balance: XXX ADA
  ```

- [ ] 3. **Check browser console**
  ```
  F12 → Console tab
  Look for red errors
  Screenshot and send to support
  ```

- [ ] 4. **Check network**
  ```
  Internet connection: OK / Slow / Offline
  Cardano node sync: 100% / XX%
  ```

- [ ] 5. **Try basic fixes**
  ```
  - Refresh page (F5)
  - Clear cache (Ctrl+Shift+Delete)
  - Try incognito mode
  - Try different browser
  - Restart wallet extension
  ```

### 7.3 📞 Liên hệ hỗ trợ

Nếu vẫn không giải quyết được, liên hệ support với thông tin:

```
🆘 Support Request Template:

Issue: [Mô tả vấn đề ngắn gọn]

Details:
- Wallet: Nami / Eternl / Lace / Yoroi
- Browser: Chrome / Firefox / Edge / Safari
- Network: Mainnet / Preprod / Testnet
- Head ID: #123 (if applicable)
- Error message: [Copy exact error]
- Screenshot: [Attach if possible]

Steps to reproduce:
1. [Bước 1]
2. [Bước 2]
3. [Lỗi xảy ra]

What I tried:
- [Đã thử gì rồi]

Expected result: [Mong muốn gì]
Actual result: [Kết quả thực tế]
```

**Kênh hỗ trợ:**
- 💬 Discord: [Link to support channel]
- 📧 Email: support@hexcore.io.vn
- 🐦 Twitter: @hexcore_hydra
- 📖 Documentation: https://docs.hexcore.io.vn

**⏱️ Thời gian phản hồi:**
- Emergency (tiền bị kẹt): < 1 giờ
- Urgent (không dùng được): < 4 giờ
- Normal (câu hỏi): < 24 giờ

---

## 8. Tips & Best Practices

### 8.1 💡 Mẹo sử dụng hiệu quả

**1. Commit đúng số tiền**
- ✅ Ước lượng trước bạn sẽ giao dịch bao nhiêu
- ✅ Commit thừa một chút (~10-20%) cho chắc
- ❌ Đừng commit toàn bộ ADA (giữ lại để trả phí L1)

**2. Join Heads với người tin cậy**
- ✅ Chơi game với bạn bè
- ✅ Trade với verified sellers
- ⚠️ Cẩn thận với người lạ (có thể offline giữa chừng)

**3. Backup wallet seed phrase**
- ✅ Viết ra giấy, lưu nơi an toàn
- ✅ Không chụp ảnh, không lưu online
- ✅ Không chia sẻ cho ai
- ❌ Mất seed phrase = mất tiền vĩnh viễn

**4. Sử dụng testnet trước**
- ✅ Thử nghiệm trên preprod/testnet trước
- ✅ Làm quen với quy trình
- ✅ Test với số tiền nhỏ trên mainnet
- ✅ Sau đó mới dùng số tiền lớn

**5. Monitor gas prices**
- ✅ Mở/đóng Head khi gas thấp (thường ban đêm)
- ✅ Càng nhiều giao dịch trong Head càng tiết kiệm
- ✅ Fanout khi không vội để tiết kiệm phí

### 8.2 🛡️ An toàn và bảo mật

**1. Wallet Security**
- ✅ Dùng password mạnh
- ✅ Enable 2FA nếu có
- ✅ Không dùng ví trên máy tính công cộng
- ✅ Lock ví khi không dùng

**2. Transaction Safety**
- ✅ Double-check địa chỉ người nhận
- ✅ Kiểm tra số tiền trước khi confirm
- ✅ Đọc kỹ popup trước khi sign
- ❌ Đừng sign giao dịch lạ

**3. Scam Prevention**
- ⚠️ Không ai hỏi seed phrase của bạn (kể cả support)
- ⚠️ Không click link lạ từ Discord/Telegram
- ⚠️ Verify website URL (phishing rất phổ biến)
- ⚠️ Too good to be true = Scam

**4. Private Keys**
- ✅ Signing key (skey) không bao giờ share
- ✅ Verification key (vkey) có thể public
- ✅ Không paste private key vào website
- ✅ Hardware wallet nếu có số tiền lớn

### 8.3 📊 Tối ưu chi phí

**Tính toán breakeven:**

| Scenario | L1 Fees | Hydra Fees | Break-even |
|----------|---------|------------|------------|
| 1 tx | 0.2 ADA | 1 ADA | ❌ Not worth |
| 5 tx | 1 ADA | 1 ADA | ⚖️ Equal |
| 10 tx | 2 ADA | 1 ADA | ✅ Save 1 ADA |
| 100 tx | 20 ADA | 1 ADA | ✅ Save 19 ADA |

**Strategy:**
1. **Few transactions**: Dùng L1 trực tiếp
2. **Multiple transactions**: Dùng Hydra để tiết kiệm
3. **High-frequency trading**: Hydra là must-have

---

## 9. Glossary (Thuật ngữ)

| Thuật ngữ | Tiếng Việt | Giải thích đơn giản |
|-----------|------------|-------------------|
| **ADA** | ADA | Đồng tiền của Cardano blockchain |
| **Admin** | Quản trị viên | Người quản lý Hexcore infrastructure (nodes, heads) |
| **Blockchain** | Chuỗi khối | Sổ cái công khai ghi lại giao dịch |
| **Commit** | Ký gửi | Bỏ tiền vào Head để giao dịch |
| **Container** | Container | Docker container - môi trường ảo hóa chạy Hydra node |
| **Fanout** | Rút tiền về | Đóng Head và trả tiền về cho mọi người |
| **Gas fee** | Phí gas | Phí trả cho mạng lưới để xử lý giao dịch |
| **Head** | Head | "Phòng giao dịch riêng" trên Layer-2 |
| **Hexcore** | Hexcore | Hệ thống quản lý Hydra Node infrastructure |
| **Hydra Node** | Hydra Node | Node xử lý giao dịch Layer-2 |
| **Hydra Hub** | Hydra Hub | Marketplace cho Provider cho thuê nodes (Hydra as a Service) |
| **Hydra Wallet** | Hydra Wallet | Ví tích hợp sẵn khả năng spin-up Hydra nodes |
| **Layer-1 (L1)** | Lớp 1 | Blockchain chính (Cardano) |
| **Layer-2 (L2)** | Lớp 2 | Giải pháp mở rộng (Hydra) |
| **Mainnet** | Mạng chính | Mạng lưới thật, dùng ADA thật |
| **NestJS** | NestJS | Framework Node.js cho Hexcore backend |
| **Node** | Nút | Máy chủ kết nối mạng blockchain / Hydra node |
| **Participant** | Người tham gia | Người tham gia vào một Head |
| **PostgreSQL** | PostgreSQL | Database lưu config Hexcore |
| **Provider** | Nhà cung cấp | Người vận hành Hexcore để cho thuê nodes |
| **Seed phrase** | Cụm từ khôi phục | 12-24 từ để khôi phục ví |
| **Snapshot** | Ảnh chụp | Ghi lại trạng thái số dư |
| **Spin-up** | Khởi tạo | Tạo và chạy một Hydra node mới |
| **Testnet** | Mạng thử nghiệm | Mạng lưới test, dùng tiền ảo |
| **Transaction (Tx)** | Giao dịch | Chuyển tiền hoặc tài sản |
| **UTxO** | UTxO | Đầu ra giao dịch chưa tiêu (Cardano model) |
| **Wallet** | Ví | Ứng dụng lưu trữ crypto |
| **Wallet Account** | Tài khoản ví | Ví Cardano dùng để vận hành Hydra node |

### Thuật ngữ Hexcore-specific:

| Thuật ngữ | Giải thích |
|-----------|------------|
| **Hexcore UI** | Giao diện web quản lý Hydra nodes (dành cho admin & provider) |
| **Hexcore Backend** | NestJS service xử lý API và điều khiển Docker |
| **Node Management** | Module quản lý lifecycle của Hydra nodes |
| **Head Management** | Module ghép nhiều nodes thành Hydra Head |
| **Docker Engine** | Hệ thống chạy container Hydra nodes |
| **Dockerode** | Docker API client cho NestJS |
| **Hydra as a Service** | Mô hình kinh doanh cho thuê Hydra nodes |
| **Provider Dashboard** | Dashboard riêng cho Providers theo dõi revenue & nodes |
| **Rental Fee** | Phí thuê node từ Provider (thường 5-10 ADA/tháng) |
| **Self-hosted** | Tự setup Hexcore trên server của mình (không thuê Provider) |
| **Managed Node** | Node được Provider quản lý, user chỉ thuê và dùng |

---

## 10. Tài nguyên học thêm

### 10.1 📚 Documentation

- **Hexcore Official Docs**: https://docs.hexcore.io.vn
- **Hydra Documentation**: https://hydra.family/head-protocol/
- **Cardano Documentation**: https://docs.cardano.org/
- **Cardano Developer Portal**: https://developers.cardano.org/

### 10.2 🎥 Video Tutorials

- **Getting Started with Hexcore** (Coming soon)
- **How Hydra Works** (Cardano Foundation)
- **Wallet Setup Guide** (Nami, Eternl, Lace)

### 10.3 🌐 Community

- **Discord**: Join our community for support and updates
- **Twitter**: Follow @hexcore_hydra for news
- **Reddit**: r/CardanoHydra
- **Telegram**: Hexcore Community Chat

### 10.4 🔧 Tools

- **Testnet Faucet**: https://docs.cardano.org/cardano-testnets/tools/faucet/
- **Block Explorer**: https://cardanoscan.io / https://preprod.cardanoscan.io
- **Wallet Downloads**: 
  - Nami: https://namiwallet.io
  - Eternl: https://eternl.io
  - Lace: https://lace.io
  - Yoroi: https://yoroi-wallet.com

---

## 🎉 Kết luận

**Hexcore** là hệ thống infrastructure quản lý Hydra Node, mang đến cho các ứng dụng blockchain khả năng giao dịch **nhanh chóng, rẻ và dễ dùng**. 

### 🎯 Với Hydra Layer-2 được Hexcore quản lý:

**Cho người dùng phổ thông:**
- ⚡ **Spin-up own node** dễ dàng qua Hydra Wallet
- 🎮 Tham gia DApps với giao dịch **tức thì** (< 1 giây)
- 💰 Tiết kiệm **phí gas** (~95% so với L1)
- 🔒 Vẫn đảm bảo **an toàn** tuyệt đối nhờ Cardano blockchain
- 🎯 Full control node của mình để join/leave Heads

**Cho Provider/Node Operator:**
- 💼 **Kiếm thu nhập thụ động** từ cho thuê nodes (5-10 ADA/node/tháng)
- 🌐 Vận hành **Hexcore infrastructure** cho nhiều clients
- 📈 **Scalable**: Hỗ trợ ~50 nodes đồng thời trên server 64GB RAM
- 🎁 Nhận **rewards** từ Hydra Hub khi uptime tốt
- 🤝 Đóng góp vào **Cardano ecosystem** và được trả công xứng đáng

**Cho developers/businesses:**
- 🔧 **Dễ triển khai**: Hexcore UI quản lý toàn bộ nodes
- 📊 **Scalable**: Hỗ trợ ≥50 nodes đồng thời
- 🐳 **Docker-based**: Dễ deploy và maintain
- 🔌 **API-driven**: NestJS backend với REST/WebSocket API
- 💾 **Persistent**: PostgreSQL lưu trữ config và state
- 🌐 **Hydra as a Service**: Thuê nodes từ Providers thay vì tự setup

**Cho app users (passive):**
- 🎮 Trải nghiệm **mượt mà** như ứng dụng Web2
- 💰 Không cần lo về node, infrastructure
- ✅ Chỉ cần connect wallet và dùng

### 🚀 Bắt đầu ngay hôm nay:

**Nếu bạn là người dùng phổ thông:**
1. Download **Hydra Wallet** (hoặc dùng Cardano wallet thông thường)
2. Nạp ADA (testnet để thử, mainnet để dùng thật)
3. Click "**Create Hydra Node**" → Node spin-up trong ~30 giây
4. Join DApp và trải nghiệm giao dịch thần tốc!

**Nếu bạn là Provider muốn kiếm thu nhập:**
1. Chuẩn bị server (16 cores, 64GB RAM, 1TB SSD recommended)
2. Setup Hexcore: `git clone ... && docker-compose up -d`
3. Đăng ký Provider trên **Hydra Hub**: https://hub.hydra.family
4. Set pricing (5-10 ADA/node/tháng) và bật auto-billing
5. Monitor dashboard & thu passive income!

**Nếu bạn là admin/developer:**
1. Đọc [Admin-Operator Guide](./admin-operator-guide.md) để setup Hexcore
2. Đọc [Developer Guide](./developer-guide.md) để tích hợp API
3. Deploy Hydra node cluster qua Hexcore UI
4. Xây dựng ứng dụng của bạn trên infrastructure này!

**Nếu bạn chỉ muốn dùng app:**
1. Cài ví Cardano (Nami, Eternl, Lace)
2. Truy cập DApp bạn thích
3. Connect wallet & enjoy!

### 📚 Tài nguyên liên quan:

- **Admin Guide**: Quản lý nodes, heads, wallet accounts
- **Developer Guide**: Tích hợp API, custom modules, deployment
- **Hexcore UI**: Web app quản trị (https://ui.hexcore.io.vn)
- **API Documentation**: REST/WebSocket endpoints
- **Hydra Protocol**: https://hydra.family/head-protocol/
- **Hydra Hub**: Marketplace cho thuê nodes (https://hub.hydra.family)
- **Provider Guide**: Hướng dẫn chi tiết vận hành Hexcore infrastructure

### 💬 Cần hỗ trợ?

**Người dùng phổ thông / App users:**
- Liên hệ app support (game, DApp bạn đang dùng)
- Hoặc community channels của ứng dụng đó
- Hydra Wallet support: wallet-support@hexcore.io.vn

**Provider/Node Operator:**
- 💬 Provider Discord channel: [Link]
- 📧 Email: provider@hexcore.io.vn
- 📖 Provider Guide: [Link to detailed provider docs]
- 🆘 24/7 Priority support cho Providers

**Admin/Developer:**
- 💬 Chat với chúng tôi trên Discord
- 📧 Email: support@hexcore.io.vn
- 📖 Đọc docs: https://docs.hexcore.io.vn

**Chúc bạn có trải nghiệm tuyệt vời với Hexcore và Hydra Layer-2! 🚀**

---

## 📋 Document Information

| Info | Value |
|------|-------|
| **Document Type** | User Functional Guide |
| **Version** | 1.1.0 |
| **Last Updated** | October 6, 2025 |
| **Authors** | Aniadev |
| **Audience** | End users (phổ thông & providers), App users, Merchants, Node Operators |
| **Related Docs** | [Admin Guide](./admin-operator-guide.md), [Developer Guide](./developer-guide.md), [SRS](../SRS.md), [Provider Guide](#) |
| **System Version** | Hexcore v0.0.1, Hydra Node v0.20.0, Hydra Hub v1.0.0 |
| **New in v1.1** | Added Provider/Node Operator section, Spin-up own node guide, Hydra as a Service model |

---

*© 2025 Hexcore Team. All rights reserved.*  
*Hexcore is a Cardano Hydra infrastructure management system.*  
*Hydra Hub - Hydra as a Service platform powered by Hexcore.*
