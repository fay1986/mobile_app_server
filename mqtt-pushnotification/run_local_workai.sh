#!/bin/bash
DEBUG_MESSAGE=1 ALLOW_GROUP_NOTIFICATION=0 \
REDIS_PASSWORD='87302aKecatcp' REDIS_HOST='rds.tiegushi.com' \
MQTT_URL='ws://mq.tiegushi.com:80' \
MONGO_URL=mongodb://workAIAdmin:weo23biHUI@aidb.tiegushi.com:27017/workai?replicaSet=workaioplog\&readPreference=primaryPreferred\&connectTimeoutMS=30000\&socketTimeoutMS=30000\&poolSize=20 \
node main.js
