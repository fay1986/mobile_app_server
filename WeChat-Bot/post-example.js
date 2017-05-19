var mongoid = function(){
  return new Date().getTime() + '' + Math.round(Math.random()*9999999);
};

example = function(){
  return {
    "pub": [{
        "_id": mongoid(),
        "type": "image",
        "currentCount": 1,
        "totalCount": 1,
        "isImage": true,
        "owner": "ras6CfDNxX7mD6zq7",
        "imgUrl": "http://data.tiegushi.com/ocmainimages/mainimage10.jpg",
        "filename": "zR2Y5Ar9k9LZQS9vS_1494485644336_cdv_photo_002.jpg",
        "URI": "file:///var/mobile/Containers/Data/Application/532583D2-EAE5-4B78-ACBC-1D0BE4C28E9C/Library/files/drafts/cdv_photo_002.jpg",
        "data_row": 1,
        "data_col": 1,
        "data_sizex": 6,
        "data_sizey": 6
    }, {
        "_id": mongoid(),
        "type": "text",
        "isImage": false,
        "owner": "ras6CfDNxX7mD6zq7",
        "text": "点击选择，修改文本",
        "style": "",
        "data_row": 7,
        "data_col": 1,
        "data_sizex": 6,
        "data_sizey": 2
    }, {
        "_id": mongoid(),
        "type": "image",
        "currentCount": 1,
        "totalCount": 1,
        "isImage": true,
        "owner": "ras6CfDNxX7mD6zq7",
        "imgUrl": "http://data.tiegushi.com/ocmainimages/mainimage11.jpg",
        "filename": "zR2Y5Ar9k9LZQS9vS_1494485704758_cdv_photo_003.jpg",
        "URI": "file:///var/mobile/Containers/Data/Application/532583D2-EAE5-4B78-ACBC-1D0BE4C28E9C/Library/files/drafts/cdv_photo_003.jpg",
        "data_row": 9,
        "data_col": 1,
        "data_sizex": 6,
        "data_sizey": 6
    }, {
        "_id": mongoid(),
        "type": "text",
        "isImage": false,
        "owner": "ras6CfDNxX7mD6zq7",
        "text": "点击选择，修改文本",
        "style": "",
        "data_row": 15,
        "data_col": 1,
        "data_sizex": 6,
        "data_sizey": 2
    }, {
        "_id": mongoid(),
        "type": "image",
        "currentCount": 1,
        "totalCount": 1,
        "isImage": true,
        "owner": "ras6CfDNxX7mD6zq7",
        "imgUrl": "http://data.tiegushi.com/ocmainimages/mainimage9.jpg",
        "filename": "zR2Y5Ar9k9LZQS9vS_1494485716781_cdv_photo_004.jpg",
        "URI": "file:///var/mobile/Containers/Data/Application/532583D2-EAE5-4B78-ACBC-1D0BE4C28E9C/Library/files/drafts/cdv_photo_004.jpg",
        "data_row": 17,
        "data_col": 1,
        "data_sizex": 6,
        "data_sizey": 6
    }, {
        "_id": mongoid(),
        "type": "text",
        "isImage": false,
        "owner": "ras6CfDNxX7mD6zq7",
        "text": "点击选择，修改文本",
        "style": "",
        "data_row": 23,
        "data_col": 1,
        "data_sizex": 6,
        "data_sizey": 2
    }],
    "title": "故事样张",
    "browse": 0,
    "heart": [],
    "retweet": [],
    "comment": [],
    "commentsCount": 0,
    "addontitle": "",
    "mainImage": "http://data.tiegushi.com/ocmainimages/mainimage1.jpg",
    "publish": false,
    "owner": "ras6CfDNxX7mD6zq7",
    "ownerName": "故事贴",
    "ownerIcon": "/userPicture.png",
    "createdAt": new Date(),
    "isReview": true,
    "insertHook": true,
    "import_status": "done",
    "fromUrl": ""
  }
};
module.exports = example;