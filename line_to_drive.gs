//準備
//ログ保存用にスプレッドシートを作成し、'log'という名前のシートを用意してください

// LINE developersのメッセージ送受信設定に記載のアクセストークン
var LINE_ACCESS_TOKEN = 'xxxx';

//写真のルートフォルダのID。ここに年ごとのフォルダが作られる。
var ROOT_FOLDER_ID = 'xxxx'

//LINE Messaging APIからPOST送信を受けたときに起動する
// e はJSON文字列
function doPost(e){

  logSpreadsheet("doPost")

  if (typeof e === "undefined"){
    //eがundefinedの場合動作を終了する
    return;
  } 

  //JSON文字列をパース(解析)し、変数jsonに格納する
  var json = JSON.parse(e.postData.contents);

  logSpreadsheet(json)

  //受信したメッセージ情報を変数に格納する
  var reply_token　= json.events[0].replyToken; //reply token
  var messageId = json.events[0].message.id; //メッセージID
  var messageType = json.events[0].message.type; //メッセージタイプ


  logSpreadsheet(messageType)

  //LINEで送信されたものが画像以外の場合は終了。
  if(messageType !== "image"){
    //var messageNotImage = "画像を送信してください"
    return;
  }

  var LINE_END_POINT = "https://api-data.line.me/v2/bot/message/" + messageId + "/content";
  
  //変数LINE_END_POINTとreply_tokenを関数getImageに渡し、getImageを起動する
  getImage(LINE_END_POINT, reply_token);
  }


//Blob形式で画像を取得する
function getImage(LINE_END_POINT, reply_token){
  logSpreadsheet("getImage")
  var date = new Date(); //現在日時を取得
  var formattedDate = Utilities.formatDate(date, "JST", "yyyyMMdd-HHmmss");

  logSpreadsheet("formatdate")

  try {
    var url = LINE_END_POINT;
    res = getImageRes(LINE_END_POINT)
    logSpreadsheet(LINE_END_POINT)
    //Blob形式で画像を取得し、ファイル名を設定する
    //ファイル名: LINE画像_YYYYMMDD_HHmmss.png
    var imageBlob = res.getBlob().getAs("image/png").setName("line_" + formattedDate + ".png")

    logSpreadsheet("blob")

    //変数imageBlobとreply_tokenを関数saveImageに渡し、saveImageを起動する
    saveImage(imageBlob, reply_token)

  } catch(e) {
    //例外エラーが起きた時にログを残す
    Logger.log(e.message);
    logSpreadsheet(e.message)

  }
}


function getImageRes(LINE_END_POINT){

  try {

    res = UrlFetchApp.fetch(LINE_END_POINT, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
      },
      'method': 'get',
    });

    //Logger.log(res)
    return res

  } catch(e) {
    //例外エラーが起きた時にログを残す
    Logger.log(e.message);
    logSpreadsheet(e.message)

  }
}


//画像をGoogle Driveのフォルダーに保存する
function saveImage(imageBlob, reply_token){
  try{
    var year = new Date().getFullYear()
    targetFolderId = getFolderPathOfYear(year)

    var folder = DriveApp.getFolderById(targetFolderId);
    var file = folder.createFile(imageBlob);

    var message = "「" + folder.getName() + "」に画像を保存しました";
  
    //変数reply_tokenとmessageを関数sendMessageに渡し、sendMessageを起動する
    sendMessage(reply_token, message)

  } catch(e){
    //例外エラーが起きた時にログを残す
    Logger.log(e)
  }
}


//ユーザーにメッセージを送信する
function sendMessage(reply_token, text){
  //logSpreadsheet(reply_token,LINE_ACCESS_TOKEN)
  //返信先URL
  var reply_url = "https://api.line.me/v2/bot/message/reply";  

  UrlFetchApp.fetch(reply_url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      'messages': [{
        'type': 'text',
        'text': text,
      }],
    }),
  });

}




// 年ごとのフォルダ
function getFolderPathOfYear(year){
  folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  childFolders = folder.getFolders();

  while(childFolders.hasNext()){
    childFolder = childFolders.next()
    if(year == childFolder.getName()){
      Logger.log(childFolder.getId())
      return childFolder.getId()
    }
  }  
  //見つからない場合作る
  newfolder = folder.createFolder(year)
  Logger.log(newfolder.getId())
  return newfolder.getId()

}


function logSpreadsheet(memo){
    // 現在開いているスプレッドシートを取得
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // 現在開いているシートを取得
  var sheet = spreadsheet.getSheetByName("log")
  

  let lastRow = sheet.getLastRow();
  // 指定したセルの値を変更する
  Logger.log(lastRow+1, memo)
  sheet.getRange(lastRow+1,1).setValue(memo);
}