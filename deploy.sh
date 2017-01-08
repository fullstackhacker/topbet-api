echo "start"

set -e

cd /topbet-api/topbet-api

NEW_REPO=topbet-api-`date +%Y-%m-%d_%H:%M:%S`

git clone git@github.com:kapadiamush/topbet-api.git $NEW_REPO
(cd $NEW_REPO && npm install)

ln -nsf `pwd`/$NEW_REPO current

(fuser -k 3500/tcp)
cd current
npm start >> /var/log/topbet-api/topbet.log&
