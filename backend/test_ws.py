import asyncio, websockets, json 
async def t(): 
    async with websockets.connect('ws://localhost:8000/ws/system?token=MTiG8UDIxuJFLXCiZIXfvPW_zm-H8dqbGytXLtx76ls') as ws:
        for i in range(3): 
            print(f'MSG{i+1}:', (await ws.recv())[:300]) 
asyncio.run(t()) 
