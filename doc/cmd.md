py --version
py -m http.server 8000

# 1. Đăng nhập
ssh root@150.95.104.232

# 2. Dừng app cũ
pm2 stop dungeoncard

# 3. Vào /var/www
cd /var/www

# 4. Clone
git clone https://github.com/interface-daodung/TeyvatCard.git
cd TeyvatCard

# 5. Cài đặt
npm install

# 6. Build
npm run build

# 7. Chạy
pm2 start npm --name "teyvatcard" -- run preview

# 8. Kiểm tra
pm2 status
curl http://localhost:3000

# 9. Mở port
sudo ufw allow 3000/tcp

# 10. Auto-start
pm2 save
pm2 startup
# (Chạy lệnh được hiển thị)