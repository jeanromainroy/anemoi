# Anemoi : Open Source Ventilator

In the context of the COVID-19 pandemic, the global health system is facing a ventilator shortage. This initiative aims at providing a low-cost and open-source hardware & software design made from ubiquitous components. 

![Screenshot](schema.jpg)


# Materials

1. Access to 3d printer and PLA filament

2. 5/8 inch vinyl tubing

3. Brass connectors & valves

4. Microcontroller (i.e. arduino) and Raspberry Pi

5. Barometric Pressure (BM280) and Differential (MXP5010) Pressure Sensors

6. more than 50W Air Pump



# Sensors

Sampling frequency for all sensors should be between >200ms to prevent performance drops on the UI.


# Arduino 

## Mise-en-place

Install the following librairies and all dependencies

1. Adafruit BMP280 Library (Pressure & Temp Sensor)



# Raspberry Pi

## Installing Raspbian

Format SD Card,

1. Open Gparted

2. Select the SD Card drive

3. Delete all partitions

4. Right click and select format fat32

5. Run all operations

To upload image to SD card,

1. Download the latest Raspbian OS (https://www.raspberrypi.org/downloads/raspbian/)

2. Make sure the sha256 matches the name of the file :

		sha256sum filename.zip

3. Unzip the img

4. We write down the name of the sd card by running,

		sudo fdisk -l

5. We unmount the sd card by running :

		sudo umount /dev/sdb1

6. We write the img to the sd card :

		sudo dd bs=4M if=image_name.img of=/dev/sdb conv=fsync

7. Wait for transfer to end

8. Open /boot/ directory

9. Add file named 'ssh' (no extension)

10. Add file named wpa_supplicant.conf

		country=CA # Your 2-digit country code
		ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
		network={
			ssid="WIFI_NAME"
			psk="WIFI_PASSWORD"
			key_mgmt=WPA-PSK
		}

11. Eject and Put the SD card in the Pi

12. Wait for Pi to boot and ssh using

		ssh pi@'ip'

		password : raspberry


## Secure the SSH

In order to ssh without a password, only the ssh-key

1. On the pi, generate new ssh keys pair (press enter for all questions) : ssh-keygen

2. Copy your computer's public id to the .ssh/authorized_keys file of the pi
	
		nano ~/.ssh/authorized_keys


## LAMP Stack

To deliver the Anemoi web app, you will need to setup your pi as a LAMP server

  * Make sure your pi is up-to-date

		sudo apt-get update
		sudo apt-get upgrade
		sudo apt-get autoremove

  * A web server
	
		sudo apt-get install apache2 -y

  * A database server
	
		sudo apt-get install mariadb-server -y

  * PHP
		
		sudo apt-get install php-fpm php-mysql -y


## The Firewall

1. Install ufw

		sudo apt-get install ufw


2. Setup the firewall

		sudo ufw default allow outgoing
		sudo ufw default deny incoming
		sudo ufw allow ssh
		sudo ufw allow 80
		sudo ufw allow 443
		sudo ufw enable
		sudo ufw status


## Mise-en-place

To setup Anemoi you need a couple of additional packages & configurations:

  * All the necessary packages
	
		sudo apt-get install git python3-dev python3-smbus i2c-tools

	
  * The Python/MySQL connector
		
		sudo python3 -m pip install mysql-connector-python


  * The tmux program to launch multiple command line processes simultaneously
	
		sudo apt-get install tmux

  
  * Apache Php Interpreter
		
		sudo apt-get install php libapache2-mod-php


  * A lib manager

		sudo apt-get install python3-pip


  * Make sure the I2C & Serial interface is enabled 

		https://learn.adafruit.com/adafruits-raspberry-pi-lesson-4-gpio-setup/configuring-i2c

	
  * In raspi-config and the timezone is the one you are in


  * Reboot
  

## Creating the database

1. Secure MySQL by running

		sudo mysql_secure_installation


1. Log into the MySQL database server

		sudo mysql

	
2. Create the DB that will be used by anemoi

		CREATE DATABASE anemoi;


3. Create a new user,

		CREATE USER 'username'@'localhost' IDENTIFIED BY 'password';

		GRANT ALL PRIVILEGES ON anemoi.* TO 'username'@'localhost' WITH GRANT OPTION;

		FLUSH PRIVILEGES;


4. Exit and Login with your new credentials

		exit
		mysql -u username -p


5. Select your database

		use anemoi;


6. Create the following tables,	

        CREATE TABLE patient (id int not null auto_increment, name VARCHAR(128), weight_kg int, age int, updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (id));

        CREATE TABLE session (id int not null auto_increment, patient_id int, vac_pc tinyint(1) not null, vac_vc tinyint(1) not null, cpap tinyint(1) not null, bipap tinyint(1) not null, peep int not null, delta_p int, respiration_rate int, inspiration_expiration_ratio float, fio2 int, trigger_level float, tidal_volume int, max_pressure int, updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE NOW(), created_at TIMESTAMP NOT NULL DEFAULT NOW(), PRIMARY KEY (id));        

        CREATE TABLE pressure (value float not null, created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(3));
        
		CREATE TABLE flow (value float not null, created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(3));


## Managing your web folder

1. Change the permissions

		sudo chown -R pi:www-data /var/www/html/

		sudo chmod -R 770 /var/www/html/


## The Anemoi Source Code


1. Clone the Anemoi Repo in /home/

		git clone https://github.com/jeanromainroy/anemoi.git

2. Copy the web files inside your Apache folder

		cp -r ~/anemoi/rpi/web/* /var/www/html/


3. Sensor Packages
		
		sudo pip3 install bmp280 pyserial


## Launching a Daemon on startup

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


