from flask import Flask, render_template, send_from_directory, request
from time import sleep
import os, subprocess, json, shutil
from datetime import date
app = Flask(__name__)

os.chdir("/home/levi/code/todo/")
notebasepath = "data/"

@app.route("/")
def main():
    return render_template("index.html")

@app.route("/tasks", methods = ['GET', 'POST'])
def tasks():
    if request.method == "GET":
        try:
            with open("data/tasks.json") as f:
                data = json.loads(f.read())
        except FileNotFoundError:
            data = {"tasks":[]}
            os.makedir("data")
            with open("data/tasks.json", "w") as f:
                f.write(json.dumps(data))
        return data
    if request.method == "POST":
        today = date.today()
        shutil.copy("data/tasks.json", f"data/backup/tasks-{today}.json")
        findata = {"tasks": request.json}

        with open('data/tasks.json', 'w', encoding='utf-8') as f:
            json.dump(findata, f, ensure_ascii=False, indent=4)
        return "success", 200
    return "failed", 500
app.run(host="0.0.0.0", port="11527", debug=True)
