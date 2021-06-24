import { Component, OnInit } from '@angular/core';
import { FerientermineService } from 'src/app/services/ferientermine.service';
import { VertretungServService } from 'src/app/services/vertretung-serv.service';

@Component({
  selector: 'app-vertretungsplan',
  templateUrl: './vertretungsplan.component.html',
  styleUrls: ['./vertretungsplan.component.scss']
})
export class VertretungsplanComponent implements OnInit {
  vertretung;

  montag;
  dienstag;
  mittwoch;
  donnerstag;
  freitag;

  wochentageschreiben(tag){
   let tagesitems=this.vertretung.filter(element=>element.wochentag==tag);

   //sortieren

   tagesitems.sort(function(a, b) {
    var nameA = a.klasse; // Groß-/Kleinschreibung ignorieren
    var nameB = b.klasse; // Groß-/Kleinschreibung ignorieren
    var stunde=a.stunde;
    var stundeB=b.stunde;
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  if(nameA==nameB){
    if(stunde<stundeB){
      return -1;}
      if(stunde>stundeB){
        return 1;
      
    }
    // Namen müssen gleich sein
    return 0;
  }
  });


  return tagesitems;
  }

  constructor(public vertretungsServ: VertretungServService, public ferienTerminServ:FerientermineService) { 
    vertretungsServ.vertretung$.subscribe(data=>this.vertretung=data);
 
  }
  ngOnInit(): void {
  }

}
