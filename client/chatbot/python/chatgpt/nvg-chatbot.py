# nvg-chatbot.py
# Author: Jon Fowler (jonfowler@protonmail.com)
# 
# This ChatGPT chatbot is a simple Python client example to be used with the NVG Chat server application.

import asyncio
import socketio
import openai
from dotenv import load_dotenv
import os
from distutils.util import strtobool

load_dotenv()

chatbot_username = os.getenv('CHATBOT_USERNAME', 'Gregbot')
regex = f'^.*({chatbot_username})'
uid = None
openai.api_key = os.getenv('CHATGPT_API_KEY')
un_color = '#000000'
conversational = bool(strtobool(os.getenv('CHATBOT_CONVERSATIONAL', 'False')))
conversations = {}

# Adapted from the OpenAPI example: https://platform.openai.com/examples/default-marv-sarcastic-chat
default_prompt = f'{chatbot_username} is a chatbot that reluctantly answers questions with sarcastic responses'
chatbot_prompt = os.getenv('CHATBOT_PROMPT') if os.getenv('CHATBOT_PROMPT') != None else default_prompt
chatgpt_model = os.getenv('CHATGPT_MODEL') if os.getenv('CHATGPT_MODEL') != None else 'text-davinci-003'

sio = socketio.AsyncClient()


def check_key(dic: dict, key: str):
    """Check if a key exists in a dictionary

    Args:
        dic (dict): dictionary to check
        key (str): key to check in dictionary

    Returns:
        bool: whether key exists in dictionary
    """
    keys_list = list(dic.keys())
    output = False
    if keys_list.count(key) == 1:
        output = True
    return output


@sio.event
async def connect():
    print('connection established')
    new_user = {'uname':chatbot_username}
    await sio.emit('newUser', new_user)


@sio.on('chat message')
async def chat_message(data: dict):
    """Processes a NVG Chat WS message

    Args:
        data (dict): NVG Chat WS message JSON data
    """
    global conversations
    global uid
    message = data['message']
    query = ''
    if (chatbot_username in message or (conversational and check_key(conversations, data['uid']))) and data['type'] == 'msg' and data['uid'] != uid:
        if not(check_key(conversations, data['uid'])) and conversational:
            prompt = f'{chatbot_prompt}:\n\nYou: {message}\n{chatbot_username}:'
            conversations[data['uid']] = prompt
        elif conversational:
            prompt = conversations[data['uid']]
            prompt = f'{prompt}\nYou: {message}\n{chatbot_username}:'
            conversations[data['uid']] = prompt
        msg = openai.Completion.create(
            model=chatgpt_model,
            prompt=prompt,
            temperature=0.5,
            max_tokens=60,
            top_p=0.3,
            frequency_penalty=0.5,
            presence_penalty=0.0
        )
        response = {
            'uid': uid,
            'uname': chatbot_username,
            'color': un_color,
            'type': 'msg',
            'message': msg.choices[0].text
        }
        if conversational:
            current_text = conversations[data['uid']]
            conversations[data['uid']] = f'{current_text}{msg.choices[0].text}'
            print(conversations[data['uid']])
        await sio.emit('chat message', response)


@sio.on('newUserId')
async def new_user_id(data: str):
    """Process WS newUserId sent from server on user connection

    Args:
        data (str): user id sent from server
    """
    global uid
    uid = data


@sio.on('newUserColor')
async def new_user_color(data: str):
    """Process WS newUserColor sent from server

    Args:
        data (str): hex color string
    """
    global un_color
    un_color = data


@sio.event
async def disconnect():
    """Process disconnect message from server
    """
    print('disconnected from server')


async def main():
    await sio.connect('http://localhost:4001')
    await sio.wait()


if __name__ == '__main__':
    asyncio.run(main())