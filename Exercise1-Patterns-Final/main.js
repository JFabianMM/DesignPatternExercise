"use strict";

// OBSERVER IMPLEMENTATION//
// ***********************************************************************************
class Subject {
    constructor(){
        this.observers = [];
    }
    subscribe(o){
        this.observers.push(o);
    }
    unsubscribe(number){
        this.observers.splice(number, 1); 
    }
    notify(model){
        this.observers.forEach(observer =>{observer.notify(model);})
    }
}
class TextSubject extends Subject{
    constructor(){
        super();
        this.text = "";
    }
    notify(text){
        this.text = text;
        super.notify(this);
    }
}
class Observer{
    constructor(element) {                                     // Addeed for Factory Fesign Pattern Implementation
        this.element= element;                                 // to create several observers with different elements.
    }
    notify(subject){
        let position;                                           // Declare a position variable
        let searchWord=subject.text;                            // Get the word to be searched
        if (!searchWord){                                       // If there is not a search word
            appView.restoreHiddenElementPatterns(this.element);         // Show the hidden notes
        }else{    
            position = this.element.value.search(searchWord);   // Get the coincidence 
            if (position<0){                                    // There is no a coincidence
                appView.hideElementPatterns(this.element);              // If there is not a coincidence
            }else{
                appView.restoreHiddenElementPatterns(this.element);     // If there is a coincidence
            }
        }
    }
}
var textSubject = new TextSubject();

//******** MVC DESIGN PATTERN ******************************************************
//***************** MODEL **********************************************************
var AppModel = function AppModel() {
}; 
AppModel.prototype.getNotes = function getNotes() {                               // Get the notes from the local storage 
     return JSON.parse(localStorage.getItem("notes-stored") || "[]");   
}

AppModel.prototype.getSaveHistory = function getSaveHistory(){        
        setTimeout(()=>{
            let notes2= history.state;              // Get the notes from the state
            this.saveNotes(notes2);                 // Save the notes obtained from the state
            if (notes2!=null){
                document.location.reload();         // reload the page to render the changes 
            }
        },10);
};

AppModel.prototype.saveNotes = function saveNotes(notes) {         // Save the notes information in local storage
    localStorage.setItem("notes-stored", JSON.stringify(notes));    
}

//***************** VIEW ************************************************************
var AppView = function AppView() {
};

AppView.prototype.renderElements = function renderElements(noteElement1, noteElement2, noteElement3, notesContainer, addNoteButton, divElement) {   
    divElement.appendChild(noteElement3);                       // Insert the third element
    divElement.insertBefore(noteElement2, noteElement3);        // Insert the second element
    divElement.insertBefore(noteElement1, noteElement2);        // Insert the first element     
    notesContainer.insertBefore(divElement, addNoteButton);         // Insert the div Element in the container
}

AppView.prototype.removeElements = function removeElements(element_div){
    element_div.removeChild(element_div.children[2]);
    element_div.removeChild(element_div.children[1]);
    element_div.removeChild(element_div.children[0]);
    element_div.parentNode.removeChild(element_div);
}

AppView.prototype.hideElementPatterns = function hideElementPatterns(element){                           // Hide the elements of a note
    let elements= element.parentNode;
    elements.children[2].style.display = "none";
    elements.children[1].style.display = "none";
    elements.children[0].style.display = "none";
    elements.style.display = "none";
}

AppView.prototype.restoreHiddenElementPatterns = function restoreHiddenElementPatterns(element){                  // Show the elements of a note
    let elements= element.parentNode;
    elements.children[2].style.display = "initial";
    elements.children[1].style.display = "initial";
    elements.children[0].style.display = "initial";
    elements.style.display = "flex";
}

AppView.prototype.updateElement = function updateElement(element_date, creationDate, dateUpdate){   
    element_date.innerHTML = '<b>Creation date:</b> ' + creationDate + ', <b>Last update:</b> '+ dateUpdate;
}

//*************** CONTROLLER ******************************************************** 
var AppController = function AppController(appView, appModel) {
      this.appView = appView;
      this.appModel = appModel;
};
AppController.prototype.initialize = function initialize() {                            /// METHOD
    //    this.appView.renderAddButton();
    //    this.appView.render();
    this.renderAddButton();
    this.render();
    this.startObserver();
    this.initializeHistory();
    this.initializeDragAndDrop();
};

AppController.prototype.initializeHistory = function initializeHistory() {
    const back = document.getElementById('back');        // Button Back (undo)
    const forward = document.getElementById('forward');  // Button forward (redo)
    back.addEventListener('click', () =>{                 // Button Back (undo) function
        history.back();
        this.appModel.getSaveHistory();
    });
    forward.addEventListener('click', () =>{              // Button Forward (redo) function
        history.forward();
        this.appModel.getSaveHistory();
    });
    document.addEventListener('keydown', function(event) {   // Document Ctrl + Z (undo) function
        if (event.ctrlKey && event.key === 'z') {
            history.back();
            this.appModel.getSaveHistory();
        }
    });
    if (history.state==null){                    // Its added a state for the start page
        let notes = this.appModel.getNotes();                   
        history.pushState(notes, '1', null);          
    }
}
AppController.prototype.initializeDragAndDrop = function initializeDragAndDrop(){
    let items = document.querySelectorAll('.box');
    items.forEach(function(item) {
        item.addEventListener('dragstart', appController.handleDragStart, false);
        item.addEventListener('dragenter', appController.handleDragEnter, false);
        item.addEventListener('dragover', appController.handleDragOver, false);
        item.addEventListener('dragleave', appController.handleDragLeave, false);
        item.addEventListener('drop', appController.handleDrop, false);
        item.addEventListener('dragend', appController.handleDragEnd, false);
    });
}
AppController.prototype.renderAddButton = function renderAddButton() {                           /// METHOD 
    let notesContainer = document.getElementById("app");             // Get the container element
    let addNoteButton = notesContainer.querySelector(".add-note");   // Get the add Note button element
    addNoteButton.addEventListener("click", () => {                 // Added  to the Add Note Button 
        this.addNote();                                             // Add a new note                 
        let notes = this.appModel.getNotes();                       // Get the notes to add an new history state
        history.pushState(notes, '1', null);                        // Add an history state
   });
};
AppController.prototype.render = function render() {                // METHOD
        this.appModel.getNotes().forEach((note) => {                // Get the notes and create render the elements.
                this.createNoteElements(note.id, note.content, note.creationDate, note.dateUpdate);
    });
};

//  The search word implementation / Observer notification
AppController.prototype.startObserver = function startObserver(){
    const searchElement=document.getElementById("search");          // Get the search elememnt
    searchElement.addEventListener("input", (event)=>{              // Observer Notification
        textSubject.notify(event.target.value);
    });
}

AppController.prototype.createNoteElements = function createNoteElements(id, content, creationDate, dateUpdate){
    let divElement = document.createElement('div');             // Create the div to wrap the 3 note elements.
    divElement.classList.add("box");                            // Add a class to implement styles
    divElement.setAttribute('draggable', 'true');               // To implement drag and drop functionality
    let notesContainer = document.getElementById("app");  
    let addNoteButton = notesContainer.querySelector(".add-note");

    let noteElement1 = this.createNoteElement1(id, content, creationDate, dateUpdate);   // Create the text area element
    let noteElement2 = this.createNoteElement2(id);             // Create the delete button element
    let noteElement3 = this.createNoteElement3(creationDate, dateUpdate); // Create the creation and update dates text area element

    this.appView.renderElements(noteElement1, noteElement2, noteElement3, notesContainer, addNoteButton, divElement);

    this.subscribeObserver(noteElement1);                            // Subscribe the observer
}

// Element # 1  Text area
AppController.prototype.createNoteElement1 = function createNoteElement1(id, content, creationDate, Update) {    // Create the text area element  
    let element = document.createElement("textarea");
    element.classList.add("note");
    element.value = content;
    element.placeholder = "Write Here";
    element.id=id;
    element.creationDate=creationDate;
    element.Update=Update;
  
    element.addEventListener('keyup', function(e) {         // Add a keyup event listener
        let ban=0;                                          // flag
        if (e.key == 'Tab') {                               // New element listener for Tab key 
            e.preventDefault();
            let start = this.selectionStart;
            let end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 1;
            ban=1; 
        }
        if (e.key === ' ' || e.key === 'Spacebar' || e.key ==='Shift') {    // Avoid some keys
            ban=1; 
        }
        if (ban==0){
            appController.updateNote(id, element.value, element, creationDate);   // Update the information
            let notes = appController.appModel.getNotes();          // Get the notes to add an new history state  
            history.pushState(notes, '1', null);                    // Add an new history state
        }
    });
    return element;
}

// Element # 2  Delete note button
AppController.prototype.createNoteElement2 = function createNoteElement2(id) {                           // create a "Del Note button"
    let element = document.createElement("div");
    element.classList.add("delete");
    element.innerHTML = '<b>- Del Note</b>';
    element.addEventListener("click", () => {
        let doDelete = confirm("Do you want to delete this note?");
        if (doDelete) {
            this.deleteNote(id, element);                           // Delete the note
            let notes = this.appModel.getNotes();                   // Get the notes to add an new history state
            history.pushState(notes, '1', null);                    // Add an new history state       
        }
    });
    return element;
}

// Element # 3  Div for Creation date/ Update date information 
AppController.prototype.createNoteElement3 = function createNoteElement3(creationDate, dateUpdate) {     // Create the tirdh element
    let element = document.createElement("div");
    element.classList.add("date");
    this.appView.updateElement(element, creationDate, dateUpdate); 
    return element;
}

// Function that add a new note
AppController.prototype.addNote = function addNote() {
    let dateCreation= new Date().toLocaleString();        // Creation date 
    let dateUpdate= new Date().toLocaleString();          // The update date 
    let notes = this.appModel.getNotes();
    let id1;
    if (notes.length==0){
        id1=1;                                            // Assigns the Id number
    }else{
        id1=notes[notes.length-1].id+1;                   // Assigns the Id number
    }
    let noteObject = {                                    // Create a note object and add the information
        id: id1,
        content: "",
        creationDate: dateCreation,
        dateUpdate: dateUpdate
    };
    // Create the elements with the new information
    notes.push(noteObject);                         // Add a new object to the notes
    this.appModel.saveNotes(notes);                          // Save the notes in the local storage
    this.createNoteElements(noteObject.id, noteObject.content, noteObject.creationDate, noteObject.dateUpdate);   
}

AppController.prototype.deleteNote = function deleteNote(id, element) {
    let notes = this.appModel.getNotes().filter((note) => note.id != id);   // Get the object to be kept
    this.appModel.saveNotes(notes);
    let element_div= element.parentNode;
    this.unsubscribeObserver(element_div);                                       // Unsubscribe observer
    this.appView.removeElements(element_div);
}

AppController.prototype.updateNote = function updateNote(id, newContent, element, creationDate) {     // Update the note
    let notes = this.appModel.getNotes();
    let targetNote = notes.filter((note) => note.id == id)[0];      // Get the note object to be updated
    targetNote.content = newContent;                                // Add the new content
    targetNote.dateUpdate=new Date().toLocaleString();              // Add the new update date 
    let element_div= element.parentNode;
    let element_date=element_div.children[2];
    this.appView.updateElement(element_date, creationDate, targetNote.dateUpdate);   
    this.appModel.saveNotes(notes);
}

//  Observer Implementation / Deletion functions / Notification actions functions
//  ********************************************************************************
AppController.prototype.subscribeObserver = function subscribeObserver(element){                        // Subscribe Observer
    let miDiv1 = new Observer(element);                          // Factory Design Pattern Implementation           
    textSubject.subscribe(miDiv1);                              
}

AppController.prototype.unsubscribeObserver = function unsubscribeObserver(element){                      // Unsubscribe Observer
    let index = Array.from(element.parentElement.children).indexOf(element);    
    textSubject.unsubscribe(index);                                                  
}

AppController.prototype.updateNotePosition = function updateNotePosition(id1, element1, id2, element2) {   // Interchange the information between the two notes in the local storage 
    let notes = appModel.getNotes();                                  
    let targetNote1 = notes.filter((note) => note.id == id1)[0];  // Get the info of the source note
    let tempNoteId=targetNote1.id;                                // Get the info of the source note
    let tempNoteContent=targetNote1.content;                      // Get the info of the source note
    let tempNoteCreationDate=targetNote1.creationDate;            // Get the info of the source note
    let tempNoteDateUpdate=targetNote1.dateUpdate;                // Get the info of the source note

    let targetNote2 = notes.filter((note) => note.id == id2)[0];  // Change the info of the source note
    targetNote1.id=targetNote2.id;                                // Change the info of the source note
    targetNote1.content=targetNote2.content;                      // Change the info of the source note
    targetNote1.creationDate=targetNote2.creationDate;            // Change the info of the source note
    targetNote1.dateUpdate=targetNote2.dateUpdate;                // Change the info of the source note

    targetNote2.id=tempNoteId;                                    // Change the info of the destination note 
    targetNote2.content=tempNoteContent;                          // Change the info of the destination note
    targetNote2.creationDate=tempNoteCreationDate;                // Change the info of the destination note
    targetNote2.dateUpdate=tempNoteDateUpdate;                    // Change the info of the destination note

    element1.children[0].value=targetNote1.content;               // The changes are ejecuted in the element
    element2.children[0].value=targetNote2.content;               // The changes are ejecuted in the element

    this.appView.updateElement(element1.children[2], targetNote1.creationDate, targetNote1.dateUpdate);  // Render the changes
    this.appView.updateElement(element2.children[2], targetNote2.creationDate, targetNote2.dateUpdate);  // Render the changes
    this.appModel.saveNotes(notes);   // The changes are saved in the local storage 
}


// //  DRAG AND DROP IMPLEMENTATION
// // *************************************************************************************************
let dragSrcEl = null; 
AppController.prototype.handleDragStart = function handleDragStart(e) {      
    this.style.opacity = '0.4';
    dragSrcEl = this;                                    // Get the source element
    e.dataTransfer.effectAllowed = 'move';
}

AppController.prototype.handleDragOver = function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

AppController.prototype.handleDragEnter = function handleDragEnter(e) {
    this.classList.add('over');               // Add a class to modyfy implement new styles
}

AppController.prototype.handleDragLeave = function handleDragLeave(e) {
    this.classList.remove('over');            // Eliminate the class to restore the styles
}

AppController.prototype.handleDrop = function handleDrop(e) {    
    if (e.stopPropagation) {
        e.stopPropagation();                   // stops the browser from redirecting.
    }
    if (dragSrcEl != this) {                   
        let id1= dragSrcEl.children[0].id;     // Get the id of the source element
        let id2= this.children[0].id;          // Get the id of the destination element
        appController.updateNotePosition(id1, dragSrcEl, id2, this)   // Interchange the information between the two notes in the local storage
    }   
    let notes = appModel.getNotes();
    history.pushState(notes, '1', null);     // Add a new history state
    return false;
}

AppController.prototype.handleDragEnd = function handleDragEnd(e) {
    let items = document.querySelectorAll('.box');
    this.style.opacity = '1';
    items.forEach(function (item) {
        item.classList.remove('over');
    });
    document.location.reload();
}

//********* New Model / View / Controller ***************************************  
var appModel = new AppModel();
var appView = new AppView();
var appController = new AppController(appView, appModel);
appController.initialize();
//******************************************************************************* 



  





  

