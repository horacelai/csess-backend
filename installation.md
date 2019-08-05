# Ocamp 系統安裝手冊

系統要求：Ubuntu 18 或以上

## 基本設置

請根據以下網頁設置身用戶及防火牆
[https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04)

設置時區
```
sudo timedatectl set-timezone Asia/Hong_Kong
```

設置自動時間同步
```
sudo apt-get install ntp
```

## Nginx 設定

安裝 Nginx
```
sudo apt-get install nginx
```

設定防火牆
```
sudo ufw allow 'Nginx Full'
```

檢查 Nginx 是否安裝正常
```
sudo systemctl status nginx
```

更改 /etc/nginx/nginx.conf
```
sudo vi /etc/nging/nginx.conf
```

加入 http 內以下代碼：
```
upstream io_nodes {  
    ip_hash;           
    server 127.0.0.1:8081;           
    server 127.0.0.1:8082;          
    server 127.0.0.1:8083;           
    server 127.0.0.1:8084;
}

server {    
    listen 4000;
    server_name example.com www.example.com;

    location / {                
        proxy_set_header Upgrade $http_upgrade;                
        proxy_set_header Connection 'upgrade';
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;                
        proxy_set_header Host $host;                
        proxy_http_version 1.1;                
        proxy_pass http://io_nodes;
    }
}
```

然後更改 /etc/nginx/sites-available/default :
```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    server_name example.com www.example.com;
}
```

檢查設定是否正確
```
sudo nginx -t
```

然後重新啟動 nginx
```
sudo systemctl reload nginx
```

## 設定 HTTPS

下載 Certbot
```
sudo add-apt-repository ppa:certbot/certbot
```
```
sudo apt-get update
```
```
sudo apt-get install python-certbot-nginx
```
輸入以下指令，example.com 為你的自訂域名
```
sudo certbot --nginx -d example.com -d www.example.com
```
然後根據畫面的內容輸入資料


然後更改 /etc/nginx/nginx.conf
```
listen 4000 ssl;
```

及 /etc/nginx/sites-available/default
```
listen 443 http2 ssl;
```

Certbot 會在以上兩個檔案加入密匙的位置，如果沒有的話，請自行在 server {} 內加入以下句子
```
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem; # managed by Certbot
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem; # managed by Certbot
include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
```

取代 example.com 到你設置的域名

檢查設定是否正確
```
sudo nginx -t
```

然後重新啟動 nginx
```
sudo systemctl reload nginx
```

## 安裝 Redis
```
sudo apt install redis-server
```

然後更改 Redis 的設定
```
sudo nano /etc/redis/redis.conf
```

尋找並更改以下句子
```
supervised systemd
```

重新啟動 Redis
```
sudo systemctl restart redis.service
```

然後測試 Redis 是否運作正常
```
redis-cli ping
```

若果畫面顯示 PONG 即代表 Redis 正常運作

你亦可以到以下連結去做更保安的設定

[https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-18-04)

## 安裝 Node.js

下載 Node.js
```
cd ~
```
```
curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
```
```
sudo bash nodesource_setup.sh
```
```
sudo apt install nodejs
```

然後檢查 Node.js 的版本，以確保安裝正常
```
nodejs -v
```

下載build tool
```
sudo apt install build-essential
```

下載 PM2
```
sudo npm install pm2@latest -g
```

然後令 PM2 在 systemd 下運行
```
pm2 startup systemd
```

PM2 會生成出一個指令，然後複製貼上這個指令

然後啟動 PM2
```
sudo systemctl start pm2-[用戶名稱]
```

## 安裝 Ocamp 系統

在自己的電腦下載 csess-frontend ，然後安裝必要的 modules
```
npm install
```

然後 build
```
npm build
```

然後將 build 資料夾內的所有檔案複製至伺服器的 /var/www/html，請確保你有 /var/www/html 的 access 權限，你可以使用 chmod 或者 chown 的指令令自己有寫入的權限

重新啟動 nginx
```
sudo systemctl restart nginx
```

然後到自己的 home
```
cd ~
```

下載 csess-backend
```
git clone https://github.com/horacelai/csess-backend.git
```

下載必要的 modules
```
cd csess-backend
```
```
npm install
```

然後設置 Redis 的數據
```
node init.js
```

啟動程式
```
pm2 start app.js -f
```
輸入以上指令4次，以產生4個 instance

instance 數量是 CPU 的核心數量，如果 instance 並非4的話請更改上面 nginx.conf 的 io_nodes 行數。



如果根據以上步驟系統仍未正常運作，有可能是 nginx 的設定出錯，請瀏覽 nginx 的 error log 找出錯誤
```
sudo cat /var/log/nginx/error.log
```






[https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04)
