import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.smart_irrigation
    
    farm_id = "6959a819aa089d5969be03bc"
    print(f"Checking for farm: {farm_id}")
    
    # Try ObjectId
    try:
        obj_id = ObjectId(farm_id)
        f1 = await db.farms.find_one({"_id": obj_id})
        if f1:
            print(f"FOUND by ObjectId! User: {f1.get('user_id')}")
        else:
            print("NOT FOUND by ObjectId")
    except:
        print("Invalid ObjectId format")

    # Try String
    f2 = await db.farms.find_one({"_id": farm_id})
    if f2:
        print(f"FOUND by String _id! User: {f2.get('user_id')}")
    else:
        print("NOT FOUND by String _id")

    # Try 'id' field
    f3 = await db.farms.find_one({"id": farm_id})
    if f3:
        print(f"FOUND by 'id' field! User: {f3.get('user_id')}")
    else:
        print("NOT FOUND by 'id' field")
        
    # List all farms
    print("\nAll Farms in DB:")
    async for f in db.farms.find():
        print(f"ID: {f.get('_id')} (type: {type(f.get('_id'))}), User: {f.get('user_id')}")

if __name__ == "__main__":
    asyncio.run(check())
