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
                document.location.reload();         
            }
        },10);
};

AppModel.prototype.saveNotes = function saveNotes(notes) {         // Save the notes information in local storage
    localStorage.setItem("notes-stored", JSON.stringify(notes));    
}

//***************** VIEW ************************************************************
var AppView = function AppView() {
};

AppView.prototype.renderElements = function renderElements(clone, notesContainer, addNoteButton) {   
    notesContainer.insertBefore(clone, addNoteButton);         // Insert the div Element in the container
}

AppView.prototype.removeElements = function removeElements(element){
    for (let child of element.children) {
        element.removeChild(child);
    }
    element.parentNode.removeChild(element);
}

AppView.prototype.hideElementPatterns = function hideElementPatterns(element){                           // Hide the elements of a note
    let elements= element.parentNode;
    for (let child of elements.children) {
        child.style.display = "none";
    }
    elements.style.display = "none";
}

AppView.prototype.restoreHiddenElementPatterns = function restoreHiddenElementPatterns(element){                  // Show the elements of a note  
    let elements= element.parentNode;
    for (let child of elements.children) {
        child.style.display = "initial";
    }
    elements.style.display = "flex";
}

AppView.prototype.updateElement = function updateElement(element_date, creationDate, dateUpdate){   
    element_date.innerHTML = '<b>Creation date:</b> ' + creationDate + ', <b>Last update:</b> '+ dateUpdate;
}

AppView.prototype.addDragAndDropListener = function addDragAndDropListener(item){
    item.addEventListener('dragstart', this.handleDragStart, false);
    item.addEventListener('dragenter', this.handleDragEnter, false);
    item.addEventListener('dragover', this.handleDragOver, false);
    item.addEventListener('dragleave', this.handleDragLeave, false);
    item.addEventListener('drop', this.handleDrop, false);
    item.addEventListener('dragend', this.handleDragEnd, false);
}
AppView.prototype.initializeDragAndDrop = function initializeDragAndDrop(){
    let items = document.querySelectorAll('.box');
    items.forEach(function(item) {
        appView.addDragAndDropListener(item);
    });
}

AppView.prototype.initializeHistory = function initializeHistory() {
    const back = document.getElementById('back');        // Button Back (undo)
    const forward = document.getElementById('forward');  // Button forward (redo)
    back.addEventListener('click', () =>{                 // Button Back (undo) function
        history.back();
        appController.appModel.getSaveHistory();
    });
    forward.addEventListener('click', () =>{              // Button Forward (redo) function
        history.forward();
        appController.appModel.getSaveHistory();
    });

    document.onkeydown = function(){
            if(event.ctrlKey && event.key === 'z'){
                history.back();
                appController.appModel.getSaveHistory(); 
            }
    }

    if (history.state==null){                    // Its added a state for the start page
        let notes = appController.appModel.getNotes();                   
        history.pushState(notes, '1', null);          
    }
}

AppView.prototype.renderAddButton = function renderAddButton() {                           /// METHOD 
    let notesContainer = document.getElementById("app");             // Get the container element
    let addNoteButton = notesContainer.querySelector(".add-note");   // Get the add Note button element
    addNoteButton.addEventListener("click", () => {                 // Added  to the Add Note Button 
        appController.addNote();                                             // Add a new note                 
        let notes = appController.appModel.getNotes();                       // Get the notes to add an new history state
        history.pushState(notes, '1', null);                        // Add an history state
   });
};

AppView.prototype.createNoteElements = function createNoteElements(id, content, creationDate, dateUpdate){
    let clone= this.createInsertNotesElements(id, content, creationDate, dateUpdate);
    let divBox = clone.querySelector("#box");
    let noteElement1 = clone.querySelector("textarea");
    let notesContainer = document.getElementById("app");  
    let addNoteButton = notesContainer.querySelector(".add-note");
    this.renderElements(clone, notesContainer, addNoteButton, divBox);
    this.subscribeObserver(noteElement1);                            // Subscribe the observer
}

AppView.prototype.createInsertNotesElements = function createInsertNotesElements(id, content, creationDate, dateUpdate){
    const template = document.querySelector('#noteContainer');
    const clone = template.content.cloneNode(true);
    let divBox = clone.querySelector("#box");
    divBox.setAttribute('draggable', 'true');               // To implement drag and drop functionality
    this.addDragAndDropListener(divBox);
    let textElement = clone.querySelector("textarea");
    textElement.value = content;
    textElement.id=id;
    textElement.creationDate=creationDate;
    textElement.Update=dateUpdate;

    textElement.onkeydown = function(){
        if(event.keyCode === 9){
            event.preventDefault();
            let v=this.value;
            let s=this.selectionStart;
            let e=this.selectionEnd;
            this.value=v.substring(0, s)+'\t'+v.substring(e);
            this.selectionStart=this.selectionEnd=s+1; 
        }
    }
    textElement.onkeyup = function(){
            appController.updateNote(id, textElement.value, textElement, creationDate);
            let notes = appController.appModel.getNotes();          // Get the notes to add an new history state  
            history.pushState(notes, '1', null);                    // Add an new history state
    };

    let divElements = clone.querySelectorAll("div");
    divElements[1].addEventListener("click", () => {
        let doDelete = confirm("Do you want to delete this note?");
        if (doDelete) {
            appController.deleteNote(id, divElements[1]);    
            let notes = appController.appModel.getNotes();                   // Get the notes to add an new history state
            history.pushState(notes, '1', null);                    // Add an new history state     
        }
    });
    
    appController.updateNote(id, textElement.value, textElement, creationDate, dateUpdate);
    return clone;
    }

//  The search word implementation / Observer notification
AppView.prototype.startObserver = function startObserver(){
    const searchElement=document.getElementById("search");          // Get the search elememnt
    searchElement.addEventListener("input", (event)=>{              // Observer Notification
        textSubject.notify(event.target.value);
    });
}
AppView.prototype.subscribeObserver = function subscribeObserver(element){                        // Subscribe Observer
    let miDiv1 = new Observer(element);                          // Factory Design Pattern Implementation           
    textSubject.subscribe(miDiv1);                              
}
AppView.prototype.unsubscribeObserver = function unsubscribeObserver(element){                      // Unsubscribe Observer
    let index = Array.from(element.parentElement.children).indexOf(element);    
    textSubject.unsubscribe(index);                                                  
}


// //  DRAG AND DROP IMPLEMENTATION
// // *************************************************************************************************
let dragSrcEl = null; 
AppView.prototype.handleDragStart = function handleDragStart(e) {      
    this.style.opacity = '0.4';
    dragSrcEl = this;                                    // Get the source element
    e.dataTransfer.effectAllowed = 'move';
}

AppView.prototype.handleDragOver = function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

AppView.prototype.handleDragEnter = function handleDragEnter(e) {
    this.classList.add('over');               // Add a class to modyfy implement new styles
}

AppView.prototype.handleDragLeave = function handleDragLeave(e) {
    this.classList.remove('over');            // Eliminate the class to restore the styles
}

AppView.prototype.handleDrop = function handleDrop(e) {    
    if (e.stopPropagation) {
        e.stopPropagation();                   // stops the browser from redirecting.
    }
    if (dragSrcEl != this) {                   
        let id1= dragSrcEl.children[0].id;     // Get the id of the source element
        let id2= this.children[0].id;          // Get the id of the destination element
        appController.updateNotePosition(id1, dragSrcEl, id2, this)   // Interchange the information between the two notes in the local storage
    }   
    let notes = appController.appModel.getNotes();
    history.pushState(notes, '1', null);     // Add a new history state
    return false;
}

AppView.prototype.handleDragEnd = function handleDragEnd(e) {
    document.location.reload();     
}

//*************** CONTROLLER ******************************************************** 
var AppController = function AppController(appView, appModel) {
      this.appView = appView;
      this.appModel = appModel;
};
AppController.prototype.initialize = function initialize() {                            /// METHOD
    this.appView.renderAddButton();
    this.render();
    this.appView.startObserver();
    this.appView.initializeHistory();
    this.appView.initializeDragAndDrop();
};


AppController.prototype.render = function render() {                // METHOD
        this.appModel.getNotes().forEach((note) => {                // Get the notes and create render the elements.
                this.appView.createNoteElements(note.id, note.content, note.creationDate, note.dateUpdate);
    });
};

let counter1=0;
// Function that add a new note
AppController.prototype.addNote = function addNote() {
    let dateCreation= new Date().toLocaleString();        // Creation date 
    let dateUpdate= new Date().toLocaleString();          // The update date 
    let notes = this.appModel.getNotes();
    let id1=0;
    if (notes.length==0){
        id1=1;                                            // Assigns the Id number
    }else{
        let len=notes.length;
        for (let i=0;i<len;i++){
            if (notes[i].id >= id1){
                id1=notes[i].id + 1;
            }
        }
    }
    let noteObject = {                                    // Create a note object and add the information
        id: id1,
        content: "",
        creationDate: dateCreation,
        dateUpdate: dateUpdate
    };
    // Create the elements with the new information
    notes.push(noteObject);                                     // Add a new object to the notes
    this.appModel.saveNotes(notes);                             // Save the notes in the local storage
    this.appView.createNoteElements(noteObject.id, noteObject.content, noteObject.creationDate, noteObject.dateUpdate);  
}

AppController.prototype.deleteNote = function deleteNote(id, element) {
    let notes = this.appModel.getNotes().filter((note) => note.id != id);   // Get the object to be kept
    this.appModel.saveNotes(notes);
    let element_div= element.parentNode;
    this.appView.unsubscribeObserver(element_div);                                       // Unsubscribe observer
    this.appView.removeElements(element_div);
}

AppController.prototype.updateNote = function updateNote(id, newContent, element, creationDate, dateUpdate=0) {     // Update the note
    let notes = this.appModel.getNotes();
    let targetNote = notes.filter((note) => note.id == id)[0];      // Get the note object to be updated
    targetNote.content = newContent;                                // Add the new content
    if (dateUpdate==0){
        targetNote.dateUpdate=new Date().toLocaleString();              // Add the new update date
    }else{
        targetNote.dateUpdate=dateUpdate;                           // Add the new update date
    }
    let element_div= element.parentNode;
    let element_date=element_div.lastElementChild; 
    this.appView.updateElement(element_date, creationDate, targetNote.dateUpdate);
    this.appModel.saveNotes(notes);
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
    
    element1.firstElementChild.value=targetNote1.content;           // The changes are ejecuted in the element
    element2.firstElementChild.value=targetNote2.content;               // The changes are ejecuted in the element

    this.appView.updateElement(element1.lastElementChild, targetNote1.creationDate, targetNote1.dateUpdate);  // Render the changes
    this.appView.updateElement(element2.lastElementChild, targetNote2.creationDate, targetNote2.dateUpdate);  // Render the changes
    this.appModel.saveNotes(notes);   // The changes are saved in the local storage 
}

//********* New Model / View / Controller ***************************************  
var appModel = new AppModel();
var appView = new AppView();
var appController = new AppController(appView, appModel);
appController.initialize();
//******************************************************************************* 




  





  

