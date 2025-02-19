#!/bin/bash
set -o errexit -o errtrace -o pipefail -o nounset

# Set possible empty environment variables
export COTURN_SHARED_SECRET_KEY="${COTURN_SHARED_SECRET_KEY:-}"
export WAIT_KIBANA_URL="${WAIT_KIBANA_URL:-}"
export OV_CE_DEBUG_LEVEL="${OV_CE_DEBUG_LEVEL:-}"
export JAVA_OPTIONS=${JAVA_OPTIONS:-}
export COTURN_IP="${COTURN_IP:-auto-ipv4}"


# Generate Coturn shared secret key, if COTURN_SHARED_SECRET_KEY is not defined
if [[ -z "${COTURN_SHARED_SECRET_KEY}" ]]; then

    # Check if random shared key is generated and with value
    if [[ ! -f /run/secrets/coturn/shared-secret-key ]]; then
        # Generate directory just in case
        mkdir -p /run/secrets/coturn

        # Generate random coturn secret
        RANDOM_COTURN_SECRET="$(shuf --echo --repeat --zero-terminated --head-count=35  {A..Z} {a..z} {0..9})"

        # Replace value and generate shared-secret-key file
        sed "s|{{COTURN_SHARED_SECRET_KEY}}|${RANDOM_COTURN_SECRET}|g" \
            /usr/local/coturn-shared-key.template > /run/secrets/coturn/shared-secret-key
    fi

    # Read value
    export "$(grep -v '#' /run/secrets/coturn/shared-secret-key  | grep COTURN_SHARED_SECRET_KEY |
        sed 's/\r$//' | awk '/=/ {print $1}')"
fi

# Wait for kibana
if [ -n "${WAIT_KIBANA_URL}" ]; then
  printf "\n"
  printf "\n  ======================================="
  printf "\n      Waiting for Kibana service."
  printf "\n  ======================================="
  printf "\n"

  until curl --insecure --output /dev/null --silent --head --fail --max-time 10 --connect-timeout 10 "${WAIT_KIBANA_URL}" &> /dev/null
  do
    printf "\n  Waiting for kibana in '%s' 'URL'. This may take some minutes, please be patient..." "${WAIT_KIBANA_URL}"
    sleep 1
  done
  printf "\n  ==== Kibana is Ready ===="
fi

# Launch OpenVidu Pro
printf "\n"
printf "\n  ======================================="
printf "\n  =       LAUNCH OPENVIDU-SERVER        ="
printf "\n  ======================================="
printf "\n"

# Get coturn public ip
if [[ "${COTURN_IP}" == "auto-ipv4" ]]; then
    COTURN_IP=$(/usr/local/bin/discover_my_public_ip.sh)
elif [[ "${COTURN_IP}" == "auto-ipv6" ]]; then
    COTURN_IP=$(/usr/local/bin/discover_my_public_ip.sh --ipv6)
fi

if [[ "${OV_CE_DEBUG_LEVEL}" == "DEBUG" ]]; then
    export LOGGING_LEVEL_IO_OPENVIDU_SERVER=DEBUG
fi

if [ -n "${JAVA_OPTIONS}" ]; then
    printf "\n  Using java options: %s" "${JAVA_OPTIONS}"
fi

# Here we don't expand variables to be interpreted as separated arguments
# shellcheck disable=SC2086
java ${JAVA_OPTIONS:-} -jar openvidu-server.jar
