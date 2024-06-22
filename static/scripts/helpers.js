function LSget(key){
    return JSON.parse(localStorage.getItem(key))
}

function LSset(key, value){
    localStorage.setItem(key, JSON.stringify(value))
}

function LSexists(key){
    return Object.keys(localStorage).includes(key)
}

function genID(){
    return  Date.now().toString(16).padStart(12, 0) 
}

function _onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

function uniqueArray(array){
    return array.filter(_onlyUnique)
}


  
// Function to sort Data 
function SortData(property, listelement) { // property = [the name of the dataset value] 
    var subjects = 
        document.querySelectorAll("[data-"+ property + "]"); 
    var subjectsArray = Array.from(subjects); 
    let sorted = subjectsArray.sort(function(a, b){
        if (a.dataset[property] < b.dataset[property]) 
        return -1; 
        if (a.dataset[property] > b.dataset[property]) 
            return 1; 
        return 0; 
    });
    sorted.forEach(e => 
        listelement. 
            prepend(e)); 
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes*60000);
}

function getDateasISO(date, daystoadd=0){ 
    tzdate = addMinutes(new Date(date), new Date().getTimezoneOffset()*-1) // need to adjust dateobject to local timezone
    d = new Date(tzdate).addDays(daystoadd)
    return d.toISOString().slice(0,10)
}

Date.prototype.addDays = function(days) { // add method to Date to add days. 
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getMonday(d) { // gets previous monday for a given date
    d = new Date(d);
    var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

