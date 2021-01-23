#!/bin/bash

set -e

# Source: https://github.com/sameersbn/docker-gitlab/
map_uidgid() {
    USERMAP_ORIG_UID=$(id -u paperless)
    USERMAP_ORIG_GID=$(id -g paperless)
    USERMAP_NEW_UID=${USERMAP_UID:-$USERMAP_ORIG_UID}
    USERMAP_NEW_GID=${USERMAP_GID:-${USERMAP_ORIG_GID:-$USERMAP_NEW_UID}}
    if [[ ${USERMAP_NEW_UID} != "${USERMAP_ORIG_UID}" || ${USERMAP_NEW_GID} != "${USERMAP_ORIG_GID}" ]]; then
        echo "Mapping UID and GID for paperless:paperless to $USERMAP_NEW_UID:$USERMAP_NEW_GID"
        usermod -u "${USERMAP_NEW_UID}" paperless
        groupmod -o -g "${USERMAP_NEW_GID}" paperless
    fi
}


wait_for_postgres() {
	attempt_num=1
	max_attempts=5

	echo "Waiting for PostgreSQL to start..."

	host="${PAPERLESS_DBHOST}"
	port="${PAPERLESS_DBPORT}"

	if [[ -z $port ]] ;
	then
		port="5432"
	fi

	while !</dev/tcp/$host/$port ;
	do

		if [ $attempt_num -eq $max_attempts ]
		then
			echo "Unable to connect to database."
			exit 1
		else
			echo "Attempt $attempt_num failed! Trying again in 5 seconds..."

		fi

		attempt_num=$(expr "$attempt_num" + 1)
		sleep 5
	done


}

#
# CREATE SUPERUSER
#
superuser() {

    if [[ -n "${PAPERLESS_DBHOST}" ]]
    then
        wait_for_postgres
    fi

    if [[ ! -z "${PAPERLESS_ADMIN_PASSWORD}" ]]; then

      # create admin account if not exists
      set +e
      SUPERUSER_EXISTS=$(echo "SELECT * from auth_user;" | python3 manage.py dbshell | grep "${PAPERLESS_ADMIN_USER:=admin}")
      set -e
      echo "done"
      if [[ -z "${SUPERUSER_EXISTS}" ]]; then
        echo "Create superuser: ${PAPERLESS_ADMIN_USER}"
        cat <<EOD | python3 manage.py shell
import os
from django.contrib.auth.models import User
User.objects.create_superuser(
  os.getenv('PAPERLESS_ADMIN_USER', 'admin'),
  os.getenv('PAPERLESS_ADMIN_MAIL', 'root@localhost'),
  os.getenv('PAPERLESS_ADMIN_PASSWORD')
)
EOD
      else
        echo "Superuser \"${PAPERLESS_ADMIN_USER}\" exists already"
      fi

      # set superuser password
      echo "Set superuser password"
      cat <<EOD | python3 manage.py shell
import os
from django.contrib.auth.models import User
u = User.objects.get(username=os.getenv('PAPERLESS_ADMIN_USER', 'admin'))
u.set_password(os.getenv('PAPERLESS_ADMIN_PASSWORD'))
u.save()
EOD
    fi
}


migrations() {

	if [[ -n "${PAPERLESS_DBHOST}" ]]
	then
		wait_for_postgres
	fi

	(
		# flock is in place to prevent multiple containers from doing migrations
		# simultaneously. This also ensures that the db is ready when the command
		# of the current container starts.
		flock 200
		echo "Apply database migrations..."
		sudo -HEu paperless python3 manage.py migrate
	)  200>/usr/src/paperless/data/migration_lock

}

initialize() {
	map_uidgid

	for dir in export data data/index media media/documents media/documents/originals media/documents/thumbnails; do
		if [[ ! -d "../$dir" ]]
		then
			echo "creating directory ../$dir"
			mkdir ../$dir
		fi
	done

	echo "creating directory /tmp/paperless"
	mkdir -p /tmp/paperless

	chown -R paperless:paperless ../
	chown -R paperless:paperless /tmp/paperless

	migrations
    superuser

}

install_languages() {
	echo "Installing languages..."

	local langs="$1"
	read -ra langs <<<"$langs"

	# Check that it is not empty
	if [ ${#langs[@]} -eq 0 ]; then
		return
	fi
	apt-get update

	for lang in "${langs[@]}"; do
        pkg="tesseract-ocr-$lang"
        # English is installed by default
        #if [[ "$lang" ==  "eng" ]]; then
        #    continue
        #fi

        if dpkg -s $pkg &> /dev/null; then
        	echo "package $pkg already installed!"
        	continue
        fi

        if ! apt-cache show $pkg &> /dev/null; then
        	echo "package $pkg not found! :("
        	continue
        fi

				echo "Installing package $pkg..."
				if ! apt-get -y install "$pkg" &> /dev/null; then
					echo "Could not install $pkg"
					exit 1
				fi
    done
}

echo "Paperless-ng docker container starting..."

# Install additional languages if specified
if [[ ! -z "$PAPERLESS_OCR_LANGUAGES"  ]]; then
		install_languages "$PAPERLESS_OCR_LANGUAGES"
fi

initialize

if [[ "$1" != "/"* ]]; then
	echo Executing management command "$@"
	exec sudo -HEu paperless python3 manage.py "$@"
else
	echo Executing "$@"
	exec "$@"
fi

