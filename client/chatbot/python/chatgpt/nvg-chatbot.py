# nvg-chatbot.py
# Author: Jon Fowler (jonfowler@protonmail.com)
# 
# This ChatGPT chatbot is a simple Python client example to be used with the NVG Chat server application.

import asyncio
import socketio
import re
import openai
from dotenv import load_dotenv
import os

load_dotenv()

chatbot_username = os.getenv('CHATBOT_USERNAME') if os.getenv('CHATBOT_USERNAME') != None else 'Gregbot'
regex = f'^.*(chatbot_username)'
uid = None
openai.api_key = os.getenv('CHATGPT_API_KEY')
un_color = '#000000'

# Adapted from the OpenAPI example: https://platform.openai.com/examples/default-marv-sarcastic-chat
default_prompt = f'{chatbot_username} is a chatbot that reluctantly answers questions with sarcastic responses'
chatbot_prompt = os.getenv('CHATBOT_PROMPT') if os.getenv('CHATBOT_PROMPT') != None else default_prompt
chatgpt_model = os.getenv('CHATGPT_MODEL') if os.getenv('CHATGPT_MODEL') != None else 'text-davinci-003'

sio = socketio.AsyncClient()


@sio.event
async def connect():
    print('connection established')
    new_user = {'uname':chatbot_username}
    await sio.emit('newUser', new_user)


@sio.on('chat message')
async def chat_message(data):
    message = data['message']
    query = ''
    if chatbot_username in message and message != f'{chatbot_username} has entered the chat.':
        query = re.sub(regex, '', message)
        msg = openai.Completion.create(
            model=chatgpt_model,
            prompt=f"{chatbot_prompt}:\n\nYou: {query}\nMarv:",
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
        await sio.emit('chat message', response)


@sio.on('newUserId')
async def new_user_id(data):
    global uid
    uid = data


@sio.on('newUserColor')
async def new_user_color(data):
    global un_color
    un_color = data


@sio.event
async def my_message(data):
    print('message received with ', data)
    await sio.emit('my response', {'response': 'my response'})


@sio.event
async def disconnect():
    print('disconnected from server')


async def main():
    await sio.connect('http://localhost:4001')
    await sio.wait()


if __name__ == '__main__':
    asyncio.run(main())