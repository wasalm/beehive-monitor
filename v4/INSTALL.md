# Install Raspbian Lite

	mkdir tools
	mkdir services

# Add .ssh file

sudo raspi-config
	- hostname beehive
	- disable serial console
	- enable serial port

sudo apt-get update
sudo apt-get dist-upgrade

# Disable WIFI and bluetooth

sudo nano /etc/modprobe.d/raspi-blacklist.conf

	#wifi
	blacklist brcmfmac
	blacklist brcmutil
	#bt
	blacklist btbcm
	blacklist hci_uart

# Disable ssh password login

	(Run local if nessesary)
	ssh-keygen -t rsa -b 4096 -C "info@andries-salm.com"

	On Raspberry, run:

		mkdir -p ~/.ssh

	Place contents of id_rsa.pub in ~/.ssh/authorized_keys

	Test if everything works!

	Edit in /etc/ssh/sshd_config:
		RSAAuthentication yes
		PubkeyAuthentication yes

		ChallengeResponseAuthentication no
		PasswordAuthentication no
		UsePAM no


	Run:
		sudo service ssh reload

# Install Git
	
	sudo apt-get install git

# Install nodejs
Run

	curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - 
	sudo apt-get install -y nodejs

# Install beehive software
Copy contents of the folder `RaspberryPi` into `~/beehive` on the pi.
run

	cd ~/beehive
	sudo apt install libfftw3-dev
	sudo apt install gpiod libgpiod2 libgpiod-dev libnode-dev
	npm install
	chmod +x start.sh

Test with the command

	sudo ./start

Install with the command

	sudo systemctl enable ~/beehive/beehive.service
	sudo systemctl start ~/beehive/beehive.service

# Volume settings

	alsamixer

Set volume of all devices to 75%

	sudo alsactl store

## Writeprotect SD card
First enable overlay in `rpi-config`.
Secondly, see https://github.com/BertoldVdb/sdtool to protect the sd card properly.
Run:

	cd ~/tools
	git clone https://github.com/BertoldVdb/sdtool
	cd sdtool
	make
	sudo ./sdtool /dev/mmcblk0 lock
