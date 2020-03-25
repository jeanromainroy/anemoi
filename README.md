# Anemoi : Open Source Ventilator

In the context of the COVID-19 pandemic, the global health system is facing a ventilator shortage. This initiative aims at providing a low-cost and open-source hardware & software design made from ubiquitous components. 


# Requirements

RPI Model : 3B

OS : Raspbian Buster Lite

Min SD Card : 32 gb


# Mise-en-place
To setup Anemoi you need a couple things:

  * Make sure your server is up-to-date

		sudo apt-get update
		sudo apt-get upgrade
		sudo apt-get autoremove


  * A database in a local MySQL server (and the necessary account info and privileges to access it).
	
		sudo apt-get install mysql-server


  * A web server to serve the static files
	
		sudo apt-get install nginx


  * A firewall
	
		sudo apt-get install ufw

  * PHP
		
		sudo apt-get install php-fpm php-mysql


  * All the necessary packages
	
		sudo apt-get install git python3-dev python3-smbus i2c-tools

	
  * The Python/MySQL connector
		
		sudo python3 -m pip install mysql-connector-python


  * The tmux program to launch multiple command line processes simultaneously
	
		sudo apt-get install tmux


  * The Anemoi Repo 

		git clone https://github.com/jeanromainroy/anemoi.git


  * Sensor Packages
		
		sudo pip3 install bmp280

# General config of the rpi

1. Make sure the I2C interface is enabled in raspi-config



# General Configuration of the server

1. Make sure your hostname is set correctly,

		hostnamectl set-hostname --YOUR HOSTNAME--


2. Also add it to hosts file by sudo nano /etc/hosts and adding this under 127.0.0.1 ...
	
		--IP-- --YOUR HOSTNAME--


3. Copy your ssh public key inside .ssh/authorized_keys/


4. Make sure PasswordAuthentication is set to "no" in /etc/ssh/sshd_config


5. Restart sudo service sshd restart


6. Setup the firewall

		sudo ufw default allow outgoing
		sudo ufw default deny incoming
		sudo ufw allow ssh
		sudo ufw allow 80
		sudo ufw allow 443
		sudo ufw enable
		sudo ufw status


# Configuration of the NGINX web server

1. cd into the nginx sites-enabled directory

		cd /etc/nginx/sites-enabled


2. Remove the default file

		sudo rm default


3. Add the following config file by entering the command "sudo nano anemoi" and pasting the following :


		server{

			listen 80;
			listen [::]:80;

			server_name localhost;

			# Root Dir
			root /var/www/html/;

			# Web App Root Directory Path
			location / {
				try_files $uri $uri/ =404;
			}

			# PHP Config
			location ~ \.php$ {
				include snippets/fastcgi-php.conf;
				fastcgi_pass unix:/run/php/php7.3-fpm.sock;
			}

			location ~ /\.ht {
				deny all;
			}
		}


4. Make sure to edit the server_name value with your hostname


5. Test your configuration by typing (If any errors are reported, go back and recheck your file before continuing),

		sudo nginx -t


6. Reload NGINX,

		sudo systemctl reload nginx



# Creating the database

1. Log into the MySQL database server

		sudo mysql

	
2. Create the DB that will be used by anemoi

		CREATE DATABASE database_name; 
		
		*where database_name is the name you want your database to have*


3. Create a new user,

		CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';

		GRANT ALL PRIVILEGES ON database_name.* TO 'username'@'localhost' WITH GRANT OPTION;

		FLUSH PRIVILEGES;


4. Exit and Login with your new credentials

		exit
		mysql -u username -p


5. Select your database

		use database_name;


6. Create the following tables,	

        CREATE TABLE patient (id int not null auto_increment, name VARCHAR(128), weight_kg int, age int, updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (id));

        CREATE TABLE session (id int not null auto_increment, patient_id int, vac_pc tinyint(1) not null, vac_vc tinyint(1) not null, cpap tinyint(1) not null, bipap tinyint(1) not null, peep int not null, delta_p int, respiration_rate int, inspiration_expiration_ratio float, fio2 int, trigger_level float, tidal_volume int, max_pressure int, updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (id));        

        CREATE TABLE pressure (value float not null, created_at TIMESTAMP NOT NULL DEFAULT NOW());


# Launching a Daemon on startup

1. Create a new service

        sudo nano /lib/systemd/system/anemoi.service


2. Paste in

        [Unit]
        Description=Anemoi Daemon
		After=mysql.service

        [Service]
        Type=forking
        User=pi
        ExecStart=/usr/bin/tmux new-session -s anemoi -d 'python3 /home/pi/anemoi/run.py'
        ExecStop=/usr/bin/tmux kill-session -t anemoi
        WorkingDirectory=/home/pi/anemoi/local

        [Install]
        WantedBy=multi-user.target


3. Add service

        sudo systemctl enable anemoi.service


4. Reload

        sudo systemctl daemon-reload


5. Restart it,

        sudo systemctl restart anemoi.service


6. Check the status

        systemctl status anemoi.service

