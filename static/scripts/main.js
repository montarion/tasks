flatopts = {
    altInput: true,
    altFormat: "F j, Y",
    dateFormat: "Y-m-d",
    defaultDate: "today",
    mode:"range"
}


function savetask(data){
    
    if (!(LSexists("tasks"))){
        LSset("tasks", [])
    }
    tasks = LSget("tasks")
    if (!("id" in data)){
        data.id = genID()
    }
    data.id = data["id"].split("-").slice(-1)[0]

    // remove task before adding changed task data
    tasks = tasks.filter(function( obj ) {
        return obj.id !== data.id;
    });
    
    // remove empty task
    tasks = tasks.filter(function( obj ) {
        return obj.title !== "";
    });
    tasks.push(data)

    LSset("tasks", tasks)
    savetoserver()
    return data.id
}
function findtask(taskid){
    tasks = LSget("tasks")
    task  = tasks.find(o => o.id === taskid)
    return task
}
function savetoserver(){
    (async () => {
        const rawResponse = await fetch('/tasks', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(LSget("tasks"))
        });
        
      })();
      console.trace("posted to server")
    
}
async function loadfromserver(){// writes to localstorage
    let response = await fetch('/tasks');
    let data = await response.json();
    let tasks = data.tasks
    console.log(tasks)
    LSset("tasks", tasks)
}
function createFilterUI(){
    filterel = document.querySelector(".filters")
    
    searchel = document.createElement("input")
    searchel.classList.add("filtersearch")
    searchel.placeholder = "title or description.."
    searchel.addEventListener("keydown", function(e){
        target = e.target
        console.log(target.value)
        loadtasks({search: target.value})
    })
    filterel.append(searchel)

    tagel = document.createElement("div")
    tagel.classList.add("filtertags")

    taglist.forEach((tag) => {
        tagbutton = document.createElement("button")
        tagbutton.classList.add("tagswitch")
        tagbutton.textContent = tag
        tagbutton.dataset.active = LSget("filters").tags.includes(tag)
        tagbutton.addEventListener("click", function(e){
            realtag = e.target
            realtagname = realtag.textContent
            filterlist = LSget("filters")
            filtertaglist = filterlist.tags
            if(filtertaglist.includes(realtagname)){ // remove it
                filtertaglist = filtertaglist.filter(function(e) { return e !== realtagname })

            } else { // add it
                filtertaglist.push(realtagname)
            }
            filterlist.tags = filtertaglist
            LSset("filters", filterlist)

            realtag.dataset.active = filtertaglist.includes(realtagname)
            loadtasks()
        })
        tagel.append(tagbutton)
    })
    filterel.append(tagel)

}
function loadtasks({search=false}={}){
    tasklist = LSget("tasks")
    console.log(tasklist)
    cleartasks()
    console.log("args:", arguments)
    if (search){
        console.log(search)
        tasklist = fuzzysort.go(search, tasklist, {all: false, keys:['title', "description"]}).map(function (res) {
            return res.obj;
          });
        console.warn(tasklist)
    }
    if (LSget("filters").tags.length > 0){
        tags = LSget("filters").tags
        tasklist = tasklist.filter(function( obj ) {
            //return obj.tags.includes([tags]); // only return the tasks with the correct tags
            return tags.some((tag) => obj.tags.includes(tag))
        });
    }
    console.warn(tasklist)
    // create headers
    headers = ["late", "today", "thisweek", "later", "undated", "completed"]
    headers.forEach((header) => {

        hdr = document.createElement("div")
        hdr.classList.add("taskheader")
        hdr.id = header

        hdrtitle = document.createElement("span")
        hdrtitle.classList.add("taskheadertitle")
        hdrtitle.textContent = header
        hdr.append(hdrtitle)

        hdrcontent = document.createElement("div")
        hdrcontent.classList.add("taskheadercontent")
        hdrcontent.id = header+"-content"
        hdr.append(hdrcontent)
        document.querySelector(".tasks").append(hdr)
    })
    // actually build tasks
    tasklist.forEach((task) => {
        buildtask(task)
    })
}
function _tagupdate(taskdata){
    tagl = taskdata.tags
    id = taskdata.id
    tagl.forEach((tag) =>{
        tagbutton = document.createElement("button")
        tagbutton.classList.add("tag")
        tagbutton.textContent = tag
        tagbutton.addEventListener("click", function(e){
            realtask = e.target.parentElement
            taskobj = findtask(realtask.id)
            taskobj.tags = taskobj.tags.filter(e => e !== tag) // remove tag from taglist
            savetask(taskobj)
            updatetags(id)
        })
        taglistel.append(tagbutton)
    })
}
function updatetags(id){
    taskdata = findtask(id)
    selector = "#id-"+id + " .taglistelement"
    taglistel = document.querySelector(selector)
    taglistel.innerHTML = ""
    _tagupdate(taskdata)

}
function taskfromscratch(){
    data = {"title":"    ", "description":"      ", "duedate":null, "tags":[]};
    buildtask(data, newtask=true)
}

function cleartasks(){// clears all tasks from the screen, without removing
    document.querySelector(".tasks").innerHTML = ""
}
function removetask(taskid){
    taskid = cleanid(taskid)
    console.log("removing task with id:", taskid)
    tasks = LSget("tasks")
    tasks = tasks.filter(function( obj ) {
        return obj.id !== taskid;
    });
    LSset("tasks", tasks)
    savetoserver()
    // update ui
    console.log(document.querySelector("#id-"+taskid))
    document.querySelector("#id-"+taskid).remove()
}
function buildtask(data, newtask=false){
        if (!(Object.keys(data).includes("title"))){
        data.title = ""
    }
    if (!(Object.keys(data).includes("description"))){
        data.description = ""
    }
    if (!(Object.keys(data).includes("tags"))){
        data.tags =[]
    }
    //id = savetask(data)
    if (!(Object.keys(data).includes("id"))){
        id = genID()
    } else {
        id = data.id
    }
    
    taskel = document.createElement("div")
    taskel.classList.add("task")
    taskel.id = "id-"+id

    checkbox = document.createElement("input")
    checkbox.classList.add("checkbox")
    checkbox.type = "checkbox"
    checkbox.checked = data.checked
    checkbox.name = "checkbox"
    checkbox.addEventListener("click", function(e){
        taskdata = getdatafromelement(e.target.parentElement.id)

        savetask(taskdata)
        loadtasks()
    })
    taskel.append(checkbox)

    title = document.createElement("div")
    title.classList.add("title")
    title.classList.add("textinput")
    title.contentEditable = true
    title.textContent = data.title

    title.addEventListener("keyup", textsaver)
    taskel.append(title)
    
    descel = document.createElement("div")
    descel.classList.add("description")
    descel.classList.add("textinput")
    descel.contentEditable = true
    descel.textContent = data.description
    
    descel.addEventListener("keyup", textsaver)

    taskel.append(descel)

    tagel = document.createElement("div")
    tagel.classList.add("tagelement")
    taglistel = document.createElement("div")
    taglistel.classList.add("taglistelement")

    addtag = document.createElement("button")
    
    addtag.textContent = "add"
    addtag.innerHTML = '<i class="fa fa-plus"></i>' // plus icon
    addtag.addEventListener("click", function(e) {showtagsinpicker(e, data)});

    removebtn = document.createElement("button")
    removebtn.classList.add("fa")
    removebtn.classList.add("fa-trash")
    removebtn.addEventListener("click", function(e) {
        removetask(e.target.parentElement.id)
    });

    _tagupdate(data)

    tagel.append(taglistel)
    tagel.append(addtag)
    taskel.append(tagel)


    
    
    taskheader = document.querySelector("#undated-content")
    console.log(data)
    if (Object.keys(data).includes("duedate")){
        flatopts.defaultDate = data.duedate

        if (Object.keys(data).includes("startdate")){
            flatopts.defaultDate= [data.startdate, data.duedate]
            taskheader = getheaderfordate(data.startdate) // this means you sort by start date. end date also possible of course
            console.log(taskheader)
        }

        dateel = document.createElement("input")
        dateel.type = "text"
        dateel.classList.add("date")
        taskel.append(dateel)
        flatpickr(dateel, flatopts).config.onClose.push(function() {
            instance = arguments[2]
            realtask = instance._input.parentElement
            taskdata = getdatafromelement(realtask.id)
            savetask(taskdata)
            //getheaderfordate(taskdata.startdate).append(realtask)
            loadtasks()
        } );

        
    } else { // no due date set
        // show icon that on click turns into input field
        dateel = document.createElement("button")
        dateel.classList.add("fa")    
        dateel.classList.add("fa-calendar")
        dateel.addEventListener("click", function(e){
            oldel = e.target
            newel = document.createElement("input")
            newel.type = "text"
            newel.classList.add("date")
            oldel.replaceWith(newel)
            flatpickr(newel, flatopts).config.onClose.push(function() {
                instance = arguments[2]
                realtask = instance._input.parentElement
                taskdata = getdatafromelement(realtask.id)
                savetask(taskdata)
                console.log(taskdata)
                getheaderfordate(taskdata.startdate).append(realtask)
            } );
        })
        taskel.append(dateel)
    }
    if (newtask){// also add creation date
        taskel.dataset["creationdate"] = Date.now()
    } else {// add it to the element from data
        taskel.dataset.creationdate = data.creationdate
    }
    taskel.dataset.startdate = data.startdate ? data.startdate : false
    taskel.dataset.duedate = data.duedate ? data.duedate : false
    //document.querySelector(".tasks").prepend(taskel)

    // add remove button
    taskel.append(removebtn)

    // move to completed if task is completed
    if (data.checked){
        taskheader = document.querySelector("#completed-content")
    }
    taskheader.prepend(taskel)
    //SortData("creationdate", document.querySelector(".thisweek-content"))
}
function addbutton(){
    addel = document.createElement("div")
    addel.classList.add("addtaskbutton")
    addel.textContent = "Add task"
    addel.addEventListener("click", function(){buildtask({}, newtask=true)})
    document.querySelector(".container").append(addel)

}
function cleanid(id){
    if (id.includes("-")){// "id-089239102"
        id = id.split("-").slice(-1).join("")
    }
    return id
}
function getdatafromelement(id){
    id = cleanid(id)
    taskel = document.querySelector("#id-"+id)
    
    checked = taskel.querySelector(".checkbox").checked
    title = taskel.querySelector(".title").textContent
    desc = taskel.querySelector(".description").textContent
    creation = taskel.dataset["creationdate"]
    taglist = []
    taskel.querySelectorAll(".tag").forEach(pretag => {
        taglist.push(pretag.textContent)
    })
    
    data = {
        "checked":checked,
        "title":title,
        "description":desc,
        "tags":taglist,
        "creationdate": creation,
        "id":id
    }
    predate = taskel.querySelector(".flatpickr-input")
    if (predate){
        if (predate.value.includes("to")){
            let [s,e] = predate.value.split(" to ")
            data["startdate"]=s
            data["duedate"]=e
        } else {
            data["startdate"] = predate.value
            data["duedate"] = predate.value
        }
    }
    return data    
    
}
function textsaver(e) { // saves task on typing
    target = e.target
    parent = target.parentElement
    id = parent.id
    savetask(getdatafromelement(id))
}
function cleartextonclick(e){
    e.target.textContent = ""
}
function showtagsinpicker(e, data){
    
    tagpicker = document.createElement("div")
    tagpicker.classList.add("tagpicker")
    tagsearchel = document.createElement("input")
    tagsearchel.classList.add("tagsearch")
    tagsearchel.type = "text"
    tagsearchel.placeholder = "tags.."
    tagsearchel.addEventListener("keyup", function() {tagpicker_listener(data)});
    tagpicker.append(tagsearchel)
    tagholder = document.createElement("div")
    tagholder.classList.add("tagpicker-holder")
    tagpicker.append(tagholder)
    e.target.parentElement.append(tagpicker)
    tagpicker_listener(data)

}

function tagpicker_listener(data){ // search within tagpicker
    document.querySelectorAll(".tagpicker-tag").forEach(el => el.remove()) // first clear
    tagholder = document.querySelector(".tagpicker-holder")
    query = tagsearchel.value
    var [lst, firstres] = tagsearch(query) // search based on query
    lst.forEach((result) => {     // loop through found tags    
        tag = result.target
        newtag = !((data.tags).includes(tag))
        if (newtag){
            tagbtn = document.createElement("button")
            tagbtn.classList.add("tagpicker-tag")
            tagbtn.classList.add("tag")
            tagbtn.textContent = tag
            tagbtn.dataset.name = tag
            tagbtn.addEventListener("click", function(e){
                cbtn = e.target // need to use this because tagbtn gets overwritten on next loop
                tagname = cbtn.dataset.name
                data.tags.push(tagname)
                id = savetask(data)
                updatetags(id)
                tagpicker.remove()
            })
            tagholder.append(tagbtn)
        }
    })
}

function preparation(){
    // add some initial values to localstorage
    if (!(LSexists("filters"))){
        filters = {tags:[], search:""}
        LSset("filters", filters)
    }
}
taglist = ["work", "school", "stage", "veerle", "shopping", "app"]

var fusetags;
window.onload = async function(){
    preparation()
    await loadfromserver()
    loadtasks()
    addbutton()
    createFilterUI()

}

function tagsearch(txt){
    fullsearch = fuzzysort.go(txt, taglist, {all:true})
    searchres = null
    if (fullsearch.length>0){
        searchres = fullsearch[0].target
    }
    return [fullsearch, searchres]
}


function getheaderfordate(date){// iso8601 date, e.g: 2024-06-25
    if (date == undefined){return document.querySelector("#undated")}
    today = Date.now()
    todayISO = getDateasISO(today)
    nextweekISO =  getDateasISO(getMonday(Date.now()), 8)
    epoch = Date.parse(date)
    if (epoch < Date.parse(todayISO)){
        header = document.querySelector("#late-content")
    } else if (epoch == Date.parse(todayISO)){
        header = document.querySelector("#today-content")
    } else if ((epoch > Date.parse(todayISO)) && (epoch < Date.parse(nextweekISO))){
        header = document.querySelector("#thisweek-content")
    } else {
        header = document.querySelector("#later-content")
    }
    return header
}