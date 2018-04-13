import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

import * as XLSX from 'xlsx';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('tabChangeAnim', [
      state('*', style({
        transform: 'translateX(0)',
        opacity: '1'
      })),
      state('void', style({
        transform: 'translateX(-50%)',
        opacity: '0'
      })),

      transition('* => *', animate('200ms ease-in')),
      transition('void => *', animate('200ms ease-in'))
    ])
  ]
})
export class HomeComponent implements OnInit {

  @ViewChild('fileinput') fileinputElem: ElementRef;

  Columns = {
    to: 'EmpID',
    cc: 'CC',
    bcc: 'BCC',
    subject: 'Subject',
    message: 'Message'
  };
  file: File;
  filename: string;
  fileLoading: boolean = false;
  sheets: Array<string> = [];
  currentSheet: string;
  currentSheetData;
  data;

  toTagErrorMsg = {
    isNan: 'Please only add numbers',
    len: 'The length should be exactly 6 digits'
  }

  constructor() { }

  ngOnInit() {
  }

  newFile(e) {
    this.file = e.target.files[0];
    if (this.file) {
      this.filename = this.file.name;
      this.fileLoading = true;
      this.startFileProcessing();
    }
  }

  openFileChooser() {
    //console.log(this.file);
    if (this.file) {
      this.file = null;
      this.data = null;
      this.fileinputElem.nativeElement.value = '';
    } else {
      this.fileinputElem.nativeElement.click();
    }  
  }

  read() {
    let fileReader = new FileReader();
    let arrayBuffer: any;

    let _this = this;

    fileReader.onload = (e) => {
      arrayBuffer = fileReader.result;
      var data = new Uint8Array(arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i)
        arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      var first_sheet_name = workbook.SheetNames[0];
      if (_this.sheets.length > 0) {
        _this.sheets.splice(0, _this.sheets.length);
      }
      let d = {};
      for (let sheetName of workbook.SheetNames) {
        _this.sheets.push(sheetName);
        var worksheet = workbook.Sheets[sheetName];
        d[sheetName] = _this.processJson(XLSX.utils.sheet_to_json(worksheet, { raw: true }));
      }
      _this.currentSheet = workbook.SheetNames[0];
      
      console.log(_this.sheets);
      console.log(d);
      //_this.processJson(d);
      //console.log(d);
      _this.data = d;
      _this.currentSheetData = _this.data[_this.currentSheet];
      _this.fileLoading = false;
    }
    fileReader.readAsArrayBuffer(this.file);
  }

  startFileProcessing() {
    let _this = this;
    setTimeout(function () {
      _this.read();
    }, 1500)
  }

  processJson(obj) {
    let o = {};
    for (let item of obj) {
      let keys = Object.keys(item);
      for (let key of keys) {
        if (o[key] == null) {
          if (key == this.Columns.subject || key == this.Columns.message) {
            o[key] = "";
          } else {
            o[key] = new Array();
          }  
        }
        if (key == this.Columns.subject || key == this.Columns.message) {
          o[key] = item[key];
        } else {
          o[key].push(item[key] + "");
        }
        
      }
    }
    return o;
  }

  changeTab(sheet) {
    this.currentSheet = sheet;
    this.currentSheetData = this.data[sheet];
  }

  disp() {
    console.log(this.data);
  }

  toTagValidator(control: FormControl): Promise<any> {
    return new Promise(resolve => {
      const value = control.value;
      let result: any;
      if (isNaN(value)) {
        result = { isNan: true };
      } else if (value.length != 6) {
        result = { len: true };
      } else {
        result = null;
      }
      resolve(result);
    });    
  }

  sendEmail() {
    let url = "mailto://";
    url += this.currentSheetData[this.Columns.to].join(';');
    url += "?subject=" + this.currentSheetData[this.Columns.subject];
    url += "&body=" + encodeURIComponent(this.currentSheetData[this.Columns.message]);
    if (this.currentSheetData[this.Columns.cc]) {
      url += "&cc=" + this.currentSheetData[this.Columns.cc].join(';');
    }
    if (this.currentSheetData[this.Columns.bcc]) {
      url += "&bcc=" + this.currentSheetData[this.Columns.bcc].join(';');
    }
    console.log(url);

    var _a = document.createElement('a');
    _a.setAttribute('href', url);
    _a.click();
  }

}
