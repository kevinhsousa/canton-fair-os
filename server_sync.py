from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import sqlite3
import json
import time
import os

app = FastAPI(title="Canton Fair OS — Central Sync API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.expanduser("~/workspace/canton-intel/canton_central.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS suppliers (
            sync_id TEXT PRIMARY KEY,
            data_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS products (
            sync_id TEXT PRIMARY KEY,
            supplier_sync_id TEXT,
            data_json TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Usuários autorizados e senha mestra da viagem
AUTHORIZED_USERS = {
    "kevin": {"name": "Kevin de Sousa", "pass": "canton2026", "role": "admin"},
    "amigo": {"name": "Convidado / Equipe", "pass": "china2026", "role": "member"},
    "compras": {"name": "Time de Compras", "pass": "canton2026", "role": "member"},
}
MASTER_PASSWORD = "CANTON2026"

class LoginRequest(BaseModel):
    username: str
    password: str

class SyncPayload(BaseModel):
    user: str
    suppliers: List[Dict[str, Any]]
    products: List[Dict[str, Any]]

@app.get("/api/health")
def health():
    return {"status": "online", "system": "Canton Fair Central Hub", "time": time.time()}

@app.post("/api/login")
def login(req: LoginRequest):
    u = req.username.strip().lower()
    p = req.password.strip()
    
    # Valida senha mestra ou usuário da tabela
    if p.upper() == MASTER_PASSWORD:
        display_name = req.username.strip().capitalize() if req.username.strip() else "Membro da Equipe"
        return {"success": True, "username": u or "convidado", "displayName": display_name, "role": "member"}
        
    if u in AUTHORIZED_USERS and AUTHORIZED_USERS[u]["pass"] == p:
        return {
            "success": True, 
            "username": u, 
            "displayName": AUTHORIZED_USERS[u]["name"], 
            "role": AUTHORIZED_USERS[u]["role"]
        }
        
    raise HTTPException(status_code=401, detail="Usuário ou senha incorretos.")

@app.get("/api/sync")
def get_all():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("SELECT data_json FROM suppliers ORDER BY updated_at DESC")
    suppliers = [json.loads(row[0]) for row in c.fetchall()]
    
    c.execute("SELECT data_json FROM products ORDER BY updated_at DESC")
    products = [json.loads(row[0]) for row in c.fetchall()]
    
    conn.close()
    return {"suppliers": suppliers, "products": products, "count": {"suppliers": len(suppliers), "products": len(products)}}

@app.post("/api/sync")
def sync_data(payload: SyncPayload):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    now = int(time.time() * 1000)

    # Inserir ou atualizar fornecedores
    for s in payload.suppliers:
        sync_id = s.get("syncId")
        if sync_id:
            if not s.get("registeredBy"):
                s["registeredBy"] = payload.user
            c.execute("""
                INSERT INTO suppliers (sync_id, data_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(sync_id) DO UPDATE SET
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at
            """, (sync_id, json.dumps(s), s.get("updatedAt", now)))

    # Inserir ou atualizar produtos
    for p in payload.products:
        sync_id = p.get("syncId")
        if sync_id:
            if not p.get("registeredBy"):
                p["registeredBy"] = payload.user
            c.execute("""
                INSERT INTO products (sync_id, supplier_sync_id, data_json, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(sync_id) DO UPDATE SET
                    supplier_sync_id = excluded.supplier_sync_id,
                    data_json = excluded.data_json,
                    updated_at = excluded.updated_at
            """, (sync_id, p.get("supplierSyncId", ""), json.dumps(p), p.get("updatedAt", now)))

    conn.commit()

    # Retornar o banco consolidado completo
    c.execute("SELECT data_json FROM suppliers ORDER BY updated_at DESC")
    all_suppliers = [json.loads(row[0]) for row in c.fetchall()]
    
    c.execute("SELECT data_json FROM products ORDER BY updated_at DESC")
    all_products = [json.loads(row[0]) for row in c.fetchall()]

    conn.close()
    return {"success": True, "suppliers": all_suppliers, "products": all_products}
