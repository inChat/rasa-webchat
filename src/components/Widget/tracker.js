import { isVideo, isImage, isButtons, isText, isCarousel } from './msgProcessor';

export const fetchTracker = (requestOptions, host, userId, rasaToken) => {
  if (rasaToken) {
    const fetchOptions = Object.assign({}, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    }, requestOptions);

    return fetch(
      `${host}/conversations/${userId}/tracker?token=${rasaToken}`, fetchOptions
    ).then(res => res.json());
  } else {
    throw Error(
      'Rasa Auth Token is missing or other issue. Start your bot with the REST API enabled and specify an auth token. E.g. --enable_api --cors "*" --auth_token abc'
    );
  }
}

export const extractMessageEvents = (tracker) => {
  let events = []; let msgDetail = {};
  let eventObj = {}; let displayText = "";

  for (event of tracker.events){
    if (!["user", "bot"].includes(event.event)) { continue; } //only user or bot events

    eventObj = {
      source: event.event,
      uuid: event.message_id,
      timestamp: Math.round(event.timestamp * 1000),
      message: {}
    }

    if (("displayText" in event.metadata) && (event.metadata["displayText"] !== "")) {
      displayText = event.metadata["displayText"];
    } else {
      displayText = event.text;
    }

    if (event.data && event.data.buttons) {
      msgDetail = { text: displayText, buttons: event.data.buttons };
    } else if (event.data && event.data.quick_replies) {
      msgDetail = { text: displayText, quick_replies: event.data.quick_replies };
    } else if (event.data && event.data.attachment) {  //handles attachment.type image/video/template(carousel)
      msgDetail = { attachment: event.data.attachment };
    } else if (event.data && event.data.custom && event.data.custom.locate) {
      console.error("Not yet implemented (locate)");
      //msgDetail = { type: "locate", locate: event.data.custom.locate };
      continue;
    } else if (event.data && event.data.custom && event.data.custom.soundcloud) {
      console.error("Not yet implemented (soundcloud)");
      //msgDetail = { type: "soundcloud", embed: event.data.custom.soundcloud, title: event.data.custom.title };
      continue;
    } else if (event.data && event.data.custom && event.data.custom.handoff_host) {
      console.error("Not yet implemented (handling of custom handoff event)");
      continue;
    } else if (event.text) {
      //NB will only count as a text msg if has one 'text' key
      msgDetail = { text: displayText };
    }

    // All the different events can also have customCss
    if (event.data && event.data.customCss) {
      msgDetail['customCss'] = event.data.customCss
    }

    events.push({ ...eventObj, message: msgDetail });
  }

  return events;
}
