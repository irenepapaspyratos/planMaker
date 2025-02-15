import {
  Component,
  OnInit
} from '@angular/core';
import {
  Observable
} from 'rxjs';
import {
  concatMap,
  filter,
  map,
  mergeMap,
  take,
  tap
} from 'rxjs/operators';
import {
  Fach
} from 'src/app/enums/fach.enum';
import {
  Lehrjahr
} from 'src/app/enums/lehrjahr.enum';
import {
  PausenZeit
} from 'src/app/enums/pausen-zeit.enum';
import {
  PausenaufsichtsOrte
} from 'src/app/enums/pausenaufsichts-orte.enum';
import {
  Wochentag
} from 'src/app/enums/wochentag.enum';
import {
  Elementt
} from 'src/app/interfaces/elementt';
import {
  Lehrer
} from 'src/app/interfaces/lehrer';
import {
  PausenItem
} from 'src/app/interfaces/pausen-item';
import {
  TagesObjekt
} from 'src/app/interfaces/tages-objekt';
import {
  Termin
} from 'src/app/interfaces/termin';
import {
  EpochenPlaeneService
} from 'src/app/services/epochen-plaene.service';
import {
  FerientermineService
} from 'src/app/services/ferientermine.service';
import {
  KlassenplaeneService
} from 'src/app/services/klassenplaene.service';
import {
  LehrerService
} from 'src/app/services/lehrer.service';
import {
  LoginService
} from 'src/app/services/login.service';
import {
  getGeneratedNameForNode
} from 'typescript';

@Component({
  selector: 'app-einzelplaene',
  templateUrl: './einzelplaene.component.html',
  styleUrls: ['./einzelplaene.component.scss']
})
export class EinzelplaeneComponent implements OnInit {

  printAktiv = false;
  show() {
    this.printAktiv = true;
  }
  gewaehlterLehrer: Lehrer;
  //grundFaecher;
  lehrerListe;



  esrPlan; //aus epochenplan
  grundPlanfaecher;
  termine;
  ferien;
  pruefung;

  lehrerArray$: Observable < {
      [key: string]: Elementt[]
    } > =
    this.klassenServ.grundPlanfaecher$.pipe(
      filter(r => r !== null),
      map(x => {
        console.log(x);
        let obj: {
          [key: string]: Elementt[]
        } = {};
        x.forEach((ele: Elementt) => {
          //Mittagspause extra:
          if (ele.fach == Fach.mittag) {
            ele.zuweisung.uebstunde.forEach(el => {
              if (el.lehrer && obj[el.lehrer.kuerzel] === undefined) {
                obj[el.lehrer.kuerzel] = [];
              } else if (el.lehrer) {
                obj[el.lehrer.kuerzel].push(ele);
              }
            });
          }
          //console.log(ele);
          ele.lehrer.forEach(le => {
    
            if (obj[le.kuerzel] === undefined) {
              obj[le.kuerzel] = [];
            }
            obj[le.kuerzel].push(ele);
          });
        });
        //     console.log(obj)
        return obj;
      }));

  alleLehrer$ = this.lehrerArray$.pipe(

    //ASYNC HACK!!!
    mergeMap(async z => {
      //   let ar = new Array();
      return (await this.klassenServ.lehrerListe$.pipe(
        filter(e => e !== null),
        take(1)).toPromise()).map(gg => {
        let lehrerElemente = z[gg.kuerzel];
        console.log(gg.kuerzel);
        console.log(lehrerElemente);
        let wochenPlan = new Array(11).fill(null).map(g =>
          new Array(5).fill(null).map(() => ({
            fach: null,
            klasse: []
          }))
        );
        if (lehrerElemente !== undefined) {
          lehrerElemente.forEach(element => {
            element.zuweisung.uebstunde.forEach(zuweisung => {
              //wenn mittag nicht zum lehrer gehört, nicht anzeigen
              if (zuweisung.lehrer && zuweisung.lehrer.kuerzel !== gg.kuerzel) {

              } else
              if (wochenPlan[zuweisung.stunde][this.tagInZahl(zuweisung.wochentag)].fach === null) {
                wochenPlan[zuweisung.stunde][this.tagInZahl(zuweisung.wochentag)].fach = element.fach;
              }
              if (zuweisung.lehrer && zuweisung.lehrer.kuerzel === gg.kuerzel||element.fach!==Fach.mittag) { //ewwnen bei mittagspause lehrer definiert und gleich is ODER nicht mittag
              wochenPlan[zuweisung.stunde][this.tagInZahl(zuweisung.wochentag)].klasse.push(element.klasse);
              }
            });
          });
        }

        //      if(gg.kuerzel=="By"){
        // console.log(gg.kuerzel);
        //    console.log(wochenPlan);
        //    }
        return {
          kuerzel: gg.kuerzel,
          planB: wochenPlan,
          //  planB:
        }

      });
    }),
    tap(z => {

    })
  );

  lehrerItems$ = this.lehrerServ.lehrerSelected$.pipe(
    filter(f => f.kuerzel !== null),
    concatMap(lehrSel => {
      return this.lehrerArray$.pipe(
        take(1),
        map(l => l[lehrSel.kuerzel])
      ).toPromise();
    }),
    map(z => {
      let ar = new Array(11).fill(null).map(x => new Array(5));
      if (!!z) {
        z.forEach(el => {
          el.zuweisung.uebstunde.forEach(zuw => {
            if (ar[zuw.stunde][this.tagInZahl(zuw.wochentag)] === undefined) {
              ar[zuw.stunde][this.tagInZahl(zuw.wochentag)] = {
                fach: el.fach,
                klasse: []
              }
            }
            ar[zuw.stunde][this.tagInZahl(zuw.wochentag)].klasse.push(el.klasse);
          });
        });
      }
      return ar;
    })
  );

  tagInZahl(wochent: string) {
    switch (wochent) {
      case Wochentag.montag:
        return 0;
      case Wochentag.dienstag:
        return 1;
      case Wochentag.mittwoch:
        return 2;
      case Wochentag.donnerstag:
        return 3;
      case Wochentag.freitag:
        return 4;
    }
  }

  hintergrund(r) {
    if (r == 1) {
      return "rhy";
    } else if (r === 2) {
      return "epo"
    } else if (r === 3) {
      return "sch"
    }
  }

  lehrerItems(lehrer) {
    let ar = [];
    if (lehrer.kuerzel !== null) {
      ar = this.grundPlanfaecher.filter(el =>
        (
          el.rhythmus >= 1 ||
          el.epoche >= 1 ||
          el.schiene >= 1
        ) &&
        el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === lehrer.kuerzel)) !== -1
      ); //Hu selbst z.b hat kein rhythmisch-wert! fällt also hier raus
      //  console.log(ar); 
    }
    return ar;
  }

  zeileMitInhalt(reihe) {

    let bo = false;

    if (reihe === undefined || reihe.length == 0) {
      bo = false;
    } else {
      reihe.forEach(cell => {
        //console.log(cell);
        if (cell.length > 0) {
          bo = true;
          //   console.log(cell);
        }

      });
    }
    // console.log(bo);
    return bo;
  }

  stundenPlanZeileLeer(reihe) { //Einzelplan Stundenplan ausblenden wenn alle reihen leer sind.
    //console.log(reihe);
    let bo = false;
    reihe.forEach(obj => {
      if (obj.fach != null || obj.klasse.length != 0) {
        bo = true;
      }
    });
    return bo;
  }



  anzeigen = false;
  // this.lehrerServ.lehrerSelected$

  tagesPlaene$ = this.klassenServ.esrPlaan$.pipe(
    map(
      z => {
        let fahrtenUndProjekte = this.termine;
        let ar = [];
        this.lehrerListe.slice(0, this.lehrerListe.length).forEach(lehra => {

          let neu: {
            kuerz: string,
            plan: Array < Array < Array < Array < {
              fach ? : Fach,
              klasse ? : Lehrjahr,
              spanNr ? : number,
              ueberschrift ? : Date,
              ganztaegig ? : string,
              start ? : Date,
              ende ? : Date
            } >>> >
          } = {
            kuerz: lehra.kuerzel,
            plan: [new Array(5), new Array(5), new Array(5), new Array(5)]
          };





          this.esrPlan.forEach((abSCHN, aI) => {
            let zaehler = 0; //Für cellen-index der Montage
            abSCHN.forEach((tag: TagesObjekt) => {
              //console.log("jo");
              if (tag.tag.getDay() == 1) { //auf Montage reduzieren

                //Datumfächer erstellen und befüllen:
                //leere felder erstellen  in 2 kommen alle projekte rein! fahrten
                [0, 1, 2, 3, 4].forEach(zahl => { //0 Datum, 1 Rhythmus, 2 Epoche, 3 Schiene, 4 Fahrtenund Projekte
                  if (neu.plan[aI][zahl] == undefined) {
                    neu.plan[aI][zahl] = [];
                  }
                  if (neu.plan[aI][zahl][zaehler] == undefined) {
                    neu.plan[aI][zahl][zaehler] = [];
                  }
                });
                //Datum befüllen

                neu.plan[aI][0][zaehler].push({
                  ueberschrift: tag.tag
                }); //tag unter 0 reinpushen//UBERSCHRIFT

                ['neun', 'zehn', 'elf', 'zwoelf'].forEach((kla, k) => {
                  //IN TAbelle z.b Abschnitt 1, jede Klasse nun durchgehen (im Prinzip pro Zeile also neu)
                  let span = 0;
                  let fahrten = fahrtenUndProjekte[kla]; //aus dem Lehrerservice die Fahrten der Klasse
                  let ersterTag = new Date(); //das ist heute
                  let klasse = k + 9;
                  let fahrt = false;
                  let end = new Date();

                  //
                  let titel = "";
                  //ERst schauen, ob Projekt stattfindet //FAHRTEN ggf reinschreiben



                  this.termine.forEach((termin: Termin) => {
                    if (termin.start <= tag.tag && termin.ende >= tag.tag) {
                      fahrt = true;
                      ersterTag.setTime(termin.start.getTime());
                      titel = termin.titel + klasse + "Klasse";


                      let start = new Date(termin.start.getTime());
                      let ende = new Date(termin.ende.getTime());
                      //Span-wochen ermitteln: 

                      //Wenn projekt über zeilt geht:
                      if (start < abSCHN[0].tag) { //Wenn epoche vor Zeilenstart beginnt , dnan start auf zeilenstart ändern
                        //    console.log(start);
                        start.setTime(abSCHN[0].tag.getTime());

                        //auf Montag ändern:
                        while (start.getDay() !== 1) { //solange nicht mo ist
                          start.setDate(start.getDate() + 1);
                        }
                      }
                      if (ende >= abSCHN[abSCHN.length - 1].tag) { //Wenn epoche nach Zeilenende aufhört , dnan ende auf zeilenende ändern
                        ende.setTime(abSCHN[abSCHN.length - 1].tag.getTime());
                        //auf Montag ändern:
                        while (ende.getDay() !== 5) { //solange nicht fr ist
                          ende.setDate(ende.getDate() - 1);
                        }
                      }
                      end.setTime(ende.getTime());
                      span = this.daysBetween(start, ende);
                    }
                  });



                  if (fahrt === false) {




                    let lehrerRhyKlas = z.rhythmus[kla].filter(
                      el => el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === lehra.kuerzel)) !== -1);
                    let lehrerEpoKlas = z.epoche[kla].filter(
                      el => el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === lehra.kuerzel)) !== -1);
                    let lehrerSchKlas = z.schiene[kla].filter(
                      el => el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === lehra.kuerzel)) !== -1);



                    //  console.log(lehrerRhyKlas);

                    [lehrerRhyKlas, lehrerEpoKlas, lehrerSchKlas].forEach((itemsESR, RhyEpoSchIndex) => {
                      let bezeichnung = "";
                      if (RhyEpoSchIndex == 0) {
                        bezeichnung = "rhythmus";
                      } else if (RhyEpoSchIndex === 1) {
                        bezeichnung = "epoche";
                      } else if (RhyEpoSchIndex === 2) {
                        bezeichnung = "schiene";
                      }

                      itemsESR.forEach((element) => {
                        //console.log(element);
                        let bool = false;
                        span = 0;
                        ersterTag = new Date();



                        element.zuweisung[bezeichnung].forEach(epoche => {

                          if (epoche.start <= tag.tag && epoche.ende >= tag.tag) {

                            bool = true; //dann reinschreiben das obj später

                            //span berechnung mit Beachtung wenn Datenüber Zeile hinweg geht:

                            let start = new Date(epoche.start.getTime());
                            let ende = new Date(epoche.ende.getTime());
                            if (start.getTime() < abSCHN[0].tag.getTime()) { //Wenn epoche vor Zeilenstart beginnt , dnan start auf zeilenstart ändern
                              start.setTime(abSCHN[0].tag.getTime());
                              //auf montag setzen:
                              while (start.getDay() !== 1) { //solange nicht mo ist
                                start.setDate(start.getDate() + 1);
                              }
                            }

                            if (ende.getTime() >= abSCHN[abSCHN.length - 1].tag.getTime()) { //Wenn epoche nach Zeilenende aufhört , dnan ende auf zeilenende ändern
                              ende.setTime(abSCHN[abSCHN.length - 1].tag.getTime());
                              //auf Montag ändern:
                              while (ende.getDay() !== 5) { //solange nicht fr ist
                                ende.setDate(ende.getDate() + 1);
                              }
                            }
                            //WEENN FAHRT in Zeile LIEGT!!!!!!

                            let zeilenFahrt = this.termine.filter(element => element.start >= abSCHN[0].tag && element.ende <= abSCHN[abSCHN.length - 1].tag);
                            // console.log(zeilenFahrt[0]?.titel + element.klasse);


                            zeilenFahrt.forEach((fahrtOBj, f) => {
                              //nur fahrt in der zeile beachten:
                              if (abSCHN[0].tag && fahrtOBj.start &&
                                abSCHN[0].tag.getTime() <= fahrtOBj.start.getTime() && abSCHN[abSCHN.length - 1].tag.getTime() >= fahrtOBj.ende) {
                                if (fahrtOBj.start && fahrtOBj.ende && epoche.start && epoche.ende && //Nur wenn EIN projekt mitten in einer epoche liegt
                                  //triggert aber auch wenn zwei drin liegen..
                                  fahrtOBj.start.getTime() > epoche.start.getTime() &&
                                  fahrtOBj.ende.getTime() < epoche.ende.getTime()) {
                                  //wenn aktueller tag vorm Start der fahrt liegt: Ende anpassen
                                  if (tag.tag.getTime() >= epoche.start.getTime() && tag.tag.getTime() <= fahrtOBj.start.getTime()) {
                                    //Start bleibt wie definiert
                                    ende.setTime(fahrtOBj.start.getTime()); //Achtung hier nimmt er auch Datum vom anderen Praktikum der Klasse...
                                    while (ende.getDay() !== 5) { //solange nicht Freitag ist
                                      ende.setDate(ende.getDate() - 1);
                                    }
                                    //Wenn andere Fahrt-Start dazwischen liegt, das datum als Ende nehmen:
                                    if (zeilenFahrt.length == 2) {
                                      //e1 soll voriges Element sein:
                                      let el1 = zeilenFahrt[0];
                                      let el2 = zeilenFahrt[1];

                                      if (el1.start > el2.start) {
                                        el1 = zeilenFahrt[1];
                                        el2 = zeilenFahrt[0];
                                      }

                                      if (tag.tag.getTime() <= el1.start.getTime() && tag.tag.getTime() <= el2.start.getTime()) {
                                        ende.setTime(el1.start.getTime());
                                      }
                                    }
                                    //wenn aktueller Tag im zweiten Abschnitt liegt nach Ende der Fahrt
                                  } else if (tag.tag.getTime() <= epoche.ende.getTime() && tag.tag.getTime() >= fahrtOBj.ende.getTime()) {
                                    start.setTime(fahrtOBj.ende.getTime());
                                    while (start.getDay() !== 1) { //solange nicht montag ist
                                      start.setDate(start.getDate() + 1);
                                    }
                                    // start=datu; //ggf. einen tag später?
                                  }
                                } else { //WEnn projekt nicht mittig liegt von einer epoche
                                }
                              }
                            });
                            end.setTime(ende.getTime());
                            span = this.daysBetween(start, ende);
                            ersterTag.setTime(start.getTime());
                          }
                        });



                        //@ts-ignore
                        if (bool === true && (element.klasse === Lehrjahr[kla] || element.klasse === this.wortInZahl(kla))) {



                          neu.plan[aI][RhyEpoSchIndex + 1][zaehler].push({
                            fach: element.fach,
                            klasse: element.klasse,
                            spanNr: span,
                            ganztaegig: titel,
                            start: ersterTag,
                            ende: end
                          });




                        }
                      });
                    });


                  }

                });
                zaehler++;
              }
            })
          });

          // neu.plan[1][2][6].push({klasse:Lehrjahr.zehn})
          // console.log(neu);
          ar.push(neu);
        });
        //  console.log(ar);
        return ar;

      })
  );







  //  console.log(this.anzeigen);

  //console.log(lehrerRhyKlas);
  //    console.log(this.gewaehlterLehrer);











  rhythmusPlan$ = this.lehrerServ.lehrerSelected$.pipe(
    concatMap(plan => {
      return this.klassenServ.esrPlaan$.pipe(take(1));
    }),
    map(z => {
      let fahrtenUndProjekte = this.termine;

      // let obj:{}|{fach:Fach,lehrer:Lehrer}|{ueberschrift:string}


      let neu: Array < Array < Array < Array < {
        fach ? : Fach,
        klasse ? : Lehrjahr,
        spanNr ? : number,
        ueberschrift ? : Date,
        ganztaegig ? : string,
        start ? : Date,
        ende ? : Date
      } >>> > = [new Array(5), new Array(5), new Array(5), new Array(5)];
      //let ar=this.epochenPlanS.esr_plan;

      let anzeig = false;

      this.esrPlan.forEach((abSCHN, aI) => {
        let zaehler = 0; //Für cellen-index
        abSCHN.forEach((tag: TagesObjekt) => {
          //console.log("jo");
          if (tag.tag.getDay() == 1) { //auf Montage reduzieren

            //Datumfächer erstellen und befüllen:
            [0, 1, 2, 3, 4].forEach(zahl => {
              if (neu[aI][zahl] == undefined) {
                neu[aI][zahl] = [];
              }
              if (neu[aI][zahl][zaehler] == undefined) {
                neu[aI][zahl][zaehler] = [];
              }
            });



            neu[aI][0][zaehler].push({
              ueberschrift: tag.tag
            }); //tag unter 0 reinpushen//UBERSCHRIFT

            ['neun', 'zehn', 'elf', 'zwoelf'].forEach((kla, k) => {
              //IN TAbelle z.b Abschnitt 1, jede Klasse nun durchgehen (im Prinzip pro Zeile also neu)
              let span = 0;
              let fahrten = fahrtenUndProjekte[kla]; //aus dem Lehrerservice die Fahrten der Klasse
              let ersterTag = new Date(); //das ist heute
              let bool = false;
              let klasse = k + 9;
              let fahrt = false;
              let end = new Date();
              //
              let titel = "";
              //ERst schauen, ob Projekt stattfindet //FAHRTEN ggf reinschreiben




              fahrten.forEach(fahrtObj => {
                if (fahrtObj.start <= tag.tag && fahrtObj.ende >= tag.tag) {
                  fahrt = true;
                  ersterTag.setTime(fahrtObj.start.getTime());
                  titel = fahrtObj.titel + klasse + "Klasse";


                  let start = new Date(fahrtObj.start.getTime());
                  let ende = new Date(fahrtObj.ende.getTime());
                  //Span-wochen ermitteln: 

                  //Wenn projekt über zeilt geht:
                  if (start < abSCHN[0].tag) { //Wenn epoche vor Zeilenstart beginnt , dnan start auf zeilenstart ändern
                    //    console.log(start);
                    start.setTime(abSCHN[0].tag.getTime());

                    //auf Montag ändern:
                    while (start.getDay() !== 1) { //solange nicht mo ist
                      start.setDate(start.getDate() + 1);
                    }
                  }
                  if (ende >= abSCHN[abSCHN.length - 1].tag) { //Wenn epoche nach Zeilenende aufhört , dnan ende auf zeilenende ändern
                    ende.setTime(abSCHN[abSCHN.length - 1].tag.getTime());
                    //auf Montag ändern:
                    while (ende.getDay() !== 5) { //solange nicht fr ist
                      ende.setDate(ende.getDate() - 1);
                    }
                  }
                  end.setTime(ende.getTime());
                  span = this.daysBetween(start, ende);
                }
              });

              if (titel.length > 8) {
                neu[aI][4][zaehler].push({
                  fach: null, // später: element.fach,
                  klasse: null, // später element.lehrer[0].kuerzel,
                  spanNr: span, //später span
                  ganztaegig: titel,
                  start: ersterTag, //später ersterTag, //bei neuem Abschnitt ist es erster Tag des abschnitts
                  ende: end,
                });
              }

              //Einzelne epochen-ELemente der KLasse durchgucken, nur wenn bool noch nicht true, also fahrt noch nicht drin:
              if (fahrt === false) {
                let lehrerRhyKlas = z.rhythmus[kla].filter(
                  el => el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === this.gewaehlterLehrer.kuerzel)) !== -1);
                let lehrerEpoKlas = z.epoche[kla].filter(
                  el => el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === this.gewaehlterLehrer.kuerzel)) !== -1);
                let lehrerSchKlas = z.schiene[kla].filter(
                  el => el.lehrer.findIndex(lehr => (lehr.kuerzel !== null && lehr.kuerzel === this.gewaehlterLehrer.kuerzel)) !== -1);




                /*    if (lehrerRhyKlas.length === 0 && lehrerEpoKlas.length === 0 && lehrerSchKlas.length === 0) {
                      anzeig = true;
                    } else {}*/

                //  console.log(this.anzeigen);

                //console.log(lehrerRhyKlas);
                //    console.log(this.gewaehlterLehrer);

                lehrerRhyKlas.forEach((element) => {
                  bool = false;
                  span = 0;
                  ersterTag = new Date();

                  element.zuweisung.rhythmus.forEach(epoche => {

                    if (epoche.start <= tag.tag && epoche.ende >= tag.tag) {

                      bool = true; //dann reinschreiben das obj später

                      //span berechnung mit Beachtung wenn Datenüber Zeile hinweg geht:

                      let start = new Date(epoche.start.getTime());
                      let ende = new Date(epoche.ende.getTime());
                      if (start.getTime() < abSCHN[0].tag.getTime()) { //Wenn epoche vor Zeilenstart beginnt , dnan start auf zeilenstart ändern
                        start.setTime(abSCHN[0].tag.getTime());
                        //auf montag setzen:
                        while (start.getDay() !== 1) { //solange nicht mo ist
                          start.setDate(start.getDate() + 1);
                        }
                      }

                      if (ende.getTime() >= abSCHN[abSCHN.length - 1].tag.getTime()) { //Wenn epoche nach Zeilenende aufhört , dnan ende auf zeilenende ändern
                        ende.setTime(abSCHN[abSCHN.length - 1].tag.getTime());
                        //auf Montag ändern:
                        while (ende.getDay() !== 5) { //solange nicht fr ist
                          ende.setDate(ende.getDate() + 1);
                        }
                      }
                      //WEENN FAHRT in Zeile LIEGT!!!!!!

                      let zeilenFahrt = fahrten.filter(element => element.start >= abSCHN[0].tag && element.ende <= abSCHN[abSCHN.length - 1].tag);
                      // console.log(zeilenFahrt[0]?.titel + element.klasse);


                      zeilenFahrt.forEach((fahrtOBj, f) => {
                        //nur fahrt in der zeile beachten:
                        if (abSCHN[0].tag && fahrtOBj.start &&
                          abSCHN[0].tag.getTime() <= fahrtOBj.start.getTime() && abSCHN[abSCHN.length - 1].tag.getTime() >= fahrtOBj.ende) {
                          if (fahrtOBj.start && fahrtOBj.ende && epoche.start && epoche.ende && //Nur wenn EIN projekt mitten in einer epoche liegt
                            //triggert aber auch wenn zwei drin liegen..
                            fahrtOBj.start.getTime() > epoche.start.getTime() &&
                            fahrtOBj.ende.getTime() < epoche.ende.getTime()) {
                            //wenn aktueller tag vorm Start der fahrt liegt: Ende anpassen
                            if (tag.tag.getTime() >= epoche.start.getTime() && tag.tag.getTime() <= fahrtOBj.start.getTime()) {
                              //Start bleibt wie definiert
                              ende.setTime(fahrtOBj.start.getTime()); //Achtung hier nimmt er auch Datum vom anderen Praktikum der Klasse...

                              while (ende.getDay() !== 5) { //solange nicht Freitag ist
                                ende.setDate(ende.getDate() - 1);
                              }
                              //Wenn andere Fahrt-Start dazwischen liegt, das datum als Ende nehmen:
                              if (zeilenFahrt.length == 2) {
                                //e1 soll voriges Element sein:
                                let el1 = zeilenFahrt[0];
                                let el2 = zeilenFahrt[1];

                                if (el1.start > el2.start) {
                                  el1 = zeilenFahrt[1];
                                  el2 = zeilenFahrt[0];
                                }

                                if (tag.tag.getTime() <= el1.start.getTime() && tag.tag.getTime() <= el2.start.getTime()) {
                                  ende.setTime(el1.start.getTime());
                                }
                              }
                              //wenn aktueller Tag im zweiten Abschnitt liegt nach Ende der Fahrt
                            } else if (tag.tag.getTime() <= epoche.ende.getTime() && tag.tag.getTime() >= fahrtOBj.ende.getTime()) {
                              start.setTime(fahrtOBj.ende.getTime());
                              while (start.getDay() !== 1) { //solange nicht montag ist
                                start.setDate(start.getDate() + 1);
                              }
                              // start=datu; //ggf. einen tag später?
                            }
                          } else { //WEnn projekt nicht mittig liegt von einer epoche
                          }
                        }
                      });
                      end.setTime(ende.getTime());
                      span = this.daysBetween(start, ende);
                      ersterTag.setTime(start.getTime());
                    }
                  });



                  //@ts-ignore
                  if (bool === true && (element.klasse === Lehrjahr[kla] || element.klasse === this.wortInZahl(kla))) {

                    neu[aI][1][zaehler].push({
                      fach: element.fach,
                      klasse: element.klasse,
                      spanNr: span,
                      ganztaegig: titel,
                      start: ersterTag,
                      ende: end
                    });


                  }
                });

                lehrerEpoKlas.forEach((element) => {
                  bool = false;
                  span = 0;
                  ersterTag = new Date();

                  element.zuweisung.epoche.forEach(epoche => {

                    if (epoche.start <= tag.tag && epoche.ende >= tag.tag) {

                      bool = true; //dann reinschreiben das obj später

                      //span berechnung mit Beachtung wenn Datenüber Zeile hinweg geht:

                      let start = new Date(epoche.start.getTime());
                      let ende = new Date(epoche.ende.getTime());
                      if (start.getTime() < abSCHN[0].tag.getTime()) { //Wenn epoche vor Zeilenstart beginnt , dnan start auf zeilenstart ändern
                        start.setTime(abSCHN[0].tag.getTime());
                        //auf montag setzen:
                        while (start.getDay() !== 1) { //solange nicht mo ist
                          start.setDate(start.getDate() + 1);
                        }
                      }

                      if (ende.getTime() >= abSCHN[abSCHN.length - 1].tag.getTime()) { //Wenn epoche nach Zeilenende aufhört , dnan ende auf zeilenende ändern
                        ende.setTime(abSCHN[abSCHN.length - 1].tag.getTime());
                        //auf Montag ändern:
                        while (ende.getDay() !== 5) { //solange nicht fr ist
                          ende.setDate(ende.getDate() + 1);
                        }
                      }
                      //WEENN FAHRT in Zeile LIEGT!!!!!!

                      let zeilenFahrt = fahrten.filter(element => element.start >= abSCHN[0].tag && element.ende <= abSCHN[abSCHN.length - 1].tag);
                      // console.log(zeilenFahrt[0]?.titel + element.klasse);


                      zeilenFahrt.forEach((fahrtOBj, f) => {
                        //nur fahrt in der zeile beachten:
                        if (abSCHN[0].tag && fahrtOBj.start &&
                          abSCHN[0].tag.getTime() <= fahrtOBj.start.getTime() && abSCHN[abSCHN.length - 1].tag.getTime() >= fahrtOBj.ende) {
                          if (fahrtOBj.start && fahrtOBj.ende && epoche.start && epoche.ende && //Nur wenn EIN projekt mitten in einer epoche liegt
                            //triggert aber auch wenn zwei drin liegen..
                            fahrtOBj.start.getTime() > epoche.start.getTime() &&
                            fahrtOBj.ende.getTime() < epoche.ende.getTime()) {
                            //wenn aktueller tag vorm Start der fahrt liegt: Ende anpassen
                            if (tag.tag.getTime() >= epoche.start.getTime() && tag.tag.getTime() <= fahrtOBj.start.getTime()) {
                              //Start bleibt wie definiert
                              ende.setTime(fahrtOBj.start.getTime()); //Achtung hier nimmt er auch Datum vom anderen Praktikum der Klasse...

                              while (ende.getDay() !== 5) { //solange nicht Freitag ist
                                ende.setDate(ende.getDate() - 1);
                              }
                              //Wenn andere Fahrt-Start dazwischen liegt, das datum als Ende nehmen:
                              if (zeilenFahrt.length == 2) {
                                //e1 soll voriges Element sein:
                                let el1 = zeilenFahrt[0];
                                let el2 = zeilenFahrt[1];

                                if (el1.start > el2.start) {
                                  el1 = zeilenFahrt[1];
                                  el2 = zeilenFahrt[0];
                                }

                                if (tag.tag.getTime() <= el1.start.getTime() && tag.tag.getTime() <= el2.start.getTime()) {
                                  ende.setTime(el1.start.getTime());
                                }
                              }
                              //wenn aktueller Tag im zweiten Abschnitt liegt nach Ende der Fahrt
                            } else if (tag.tag.getTime() <= epoche.ende.getTime() && tag.tag.getTime() >= fahrtOBj.ende.getTime()) {
                              start.setTime(fahrtOBj.ende.getTime());
                              while (start.getDay() !== 1) { //solange nicht montag ist
                                start.setDate(start.getDate() + 1);
                              }
                              // start=datu; //ggf. einen tag später?
                            }
                          } else { //WEnn projekt nicht mittig liegt von einer epoche
                          }
                        }
                      });
                      end.setTime(ende.getTime());
                      span = this.daysBetween(start, ende);
                      ersterTag.setTime(start.getTime());
                    }
                  });


                  //@ts-ignore
                  if (bool === true && (element.klasse === Lehrjahr[kla] || element.klasse === this.wortInZahl(kla))) {


                    neu[aI][2][zaehler].push({
                      fach: element.fach,
                      klasse: element.klasse,
                      spanNr: span,
                      ganztaegig: titel,
                      start: ersterTag,
                      ende: end
                    });
                  }
                });





                lehrerSchKlas.forEach((element) => {
                  bool = false;
                  span = 0;
                  ersterTag = new Date();

                  element.zuweisung.schiene.forEach(epoche => {

                    if (epoche.start <= tag.tag && epoche.ende >= tag.tag) {

                      bool = true; //dann reinschreiben das obj später

                      //span berechnung mit Beachtung wenn Datenüber Zeile hinweg geht:

                      let start = new Date(epoche.start.getTime());
                      let ende = new Date(epoche.ende.getTime());
                      if (start.getTime() < abSCHN[0].tag.getTime()) { //Wenn epoche vor Zeilenstart beginnt , dnan start auf zeilenstart ändern
                        start.setTime(abSCHN[0].tag.getTime());
                        //auf montag setzen:
                        while (start.getDay() !== 1) { //solange nicht mo ist
                          start.setDate(start.getDate() + 1);
                        }
                      }

                      if (ende.getTime() >= abSCHN[abSCHN.length - 1].tag.getTime()) { //Wenn epoche nach Zeilenende aufhört , dnan ende auf zeilenende ändern
                        ende.setTime(abSCHN[abSCHN.length - 1].tag.getTime());
                        //auf Montag ändern:
                        while (ende.getDay() !== 5) { //solange nicht fr ist
                          ende.setDate(ende.getDate() + 1);
                        }
                      }
                      //WEENN FAHRT in Zeile LIEGT!!!!!!

                      let zeilenFahrt = fahrten.filter(element => element.start >= abSCHN[0].tag && element.ende <= abSCHN[abSCHN.length - 1].tag);
                      // console.log(zeilenFahrt[0]?.titel + element.klasse);


                      zeilenFahrt.forEach((fahrtOBj, f) => {
                        //nur fahrt in der zeile beachten:
                        if (abSCHN[0].tag && fahrtOBj.start &&
                          abSCHN[0].tag.getTime() <= fahrtOBj.start.getTime() && abSCHN[abSCHN.length - 1].tag.getTime() >= fahrtOBj.ende) {
                          if (fahrtOBj.start && fahrtOBj.ende && epoche.start && epoche.ende && //Nur wenn EIN projekt mitten in einer epoche liegt
                            //triggert aber auch wenn zwei drin liegen..
                            fahrtOBj.start.getTime() > epoche.start.getTime() &&
                            fahrtOBj.ende.getTime() < epoche.ende.getTime()) {
                            //wenn aktueller tag vorm Start der fahrt liegt: Ende anpassen
                            if (tag.tag.getTime() >= epoche.start.getTime() && tag.tag.getTime() <= fahrtOBj.start.getTime()) {
                              //Start bleibt wie definiert
                              ende.setTime(fahrtOBj.start.getTime()); //Achtung hier nimmt er auch Datum vom anderen Praktikum der Klasse...

                              while (ende.getDay() !== 5) { //solange nicht Freitag ist
                                ende.setDate(ende.getDate() - 1);
                              }
                              //Wenn andere Fahrt-Start dazwischen liegt, das datum als Ende nehmen:
                              if (zeilenFahrt.length == 2) {
                                //e1 soll voriges Element sein:
                                let el1 = zeilenFahrt[0];
                                let el2 = zeilenFahrt[1];

                                if (el1.start > el2.start) {
                                  el1 = zeilenFahrt[1];
                                  el2 = zeilenFahrt[0];
                                }

                                if (tag.tag.getTime() <= el1.start.getTime() && tag.tag.getTime() <= el2.start.getTime()) {
                                  ende.setTime(el1.start.getTime());
                                }
                              }
                              //wenn aktueller Tag im zweiten Abschnitt liegt nach Ende der Fahrt
                            } else if (tag.tag.getTime() <= epoche.ende.getTime() && tag.tag.getTime() >= fahrtOBj.ende.getTime()) {
                              start.setTime(fahrtOBj.ende.getTime());
                              while (start.getDay() !== 1) { //solange nicht montag ist
                                start.setDate(start.getDate() + 1);
                              }
                              // start=datu; //ggf. einen tag später?
                            }
                          } else { //WEnn projekt nicht mittig liegt von einer epoche
                          }
                        }
                      });
                      end.setTime(ende.getTime());
                      span = this.daysBetween(start, ende);
                      ersterTag.setTime(start.getTime());
                    }
                  });



                  //@ts-ignore
                  if (bool === true && (element.klasse === Lehrjahr[kla] || element.klasse === this.wortInZahl(kla))) {


                    neu[aI][3][zaehler].push({
                      fach: element.fach,
                      klasse: element.klasse,
                      spanNr: span,
                      ganztaegig: titel,
                      start: ersterTag,
                      ende: end
                    });
                  }
                });

              }
            });
            zaehler++;
          }
        });
      });
      this.anzeigen = anzeig;
      // console.log(neu);
      return neu;
    })
  );

  daysBetween(startDate, endDate) { //in weeeks geändert mit *7
    var millisecondsPerDay = 24 * 60 * 60 * 1000 * 7;
    return Math.round(((endDate) - (startDate)) / millisecondsPerDay);
  }

  wortInZahl(neun) {
    switch (neun) {
      case 'neun':
        return 9;
      case 'zehn':
        return 10;
      case 'elf':
        return 11;
      case 'zwoelf':
        return 12
    }
  }






  formatGesamtplan(klasse) {
    if (this.lehrerServ.gewaehlterPlan === "gesamtplan") {
      switch (klasse) {
        case 'plaeneContainer':
          return "gesamtPlanContainer";
        case 'stundenPlanTable':
          return "gesamtPlanStundenPlan";
        default:
          "error";
      }
    } else if (this.lehrerServ.gewaehlterPlan === "ESR") {
      switch (klasse) {
        case 'plaeneContainer':
          return "gesamtPlanContainer";
        case 'EpochenContainer':
          return "gesamtPlanEpoche";
        default:
          "error";
      }
    } else {
      return klasse;
    }

  }




  pausenRaster$ = this.epochenPlanS.pausenPlan$.pipe( //Bei Änderungen im Plan updaten
    map(z => {
      let ar = [];
      // let obj={wochenTag:Wochentag,zeit:PausenZeit,ort:PausenaufsichtsOrte};

      if (z !== null) {

        z.forEach((el: PausenItem) => {
       //   console.log(el);

          if (el.lehrer) {
            if (!ar[el.lehrer.kuerzel]) {
              ar[el.lehrer.kuerzel] = [];
            }
            ar[el.lehrer.kuerzel].push(el);
          }
        });
      }
    //  console.log(ar);
      return ar;
    })
  );

  zeitinString(zeit) {

    //console.log(zeit);
    if (zeit === "7:45-8:00") {
      return "eins"
    } else if (zeit === "9:35-9:55") {
      return "zwei"
    } else
    if (zeit === "10:25-10:45") {
      return "drei"
    } else
    if (zeit === "11:30-11:45") {
      return "vier"
    }
  }


  constructor(
    public lehrerServ: LehrerService,
    public loginServ: LoginService,
    private klassenServ: KlassenplaeneService,

    public ferienServ: FerientermineService,
    public epochenPlanS: EpochenPlaeneService,

  ) {

    //loginServ.lehrerladen();

    lehrerServ.lehrerSelected$.subscribe(data => {
      this.gewaehlterLehrer = data;
    });



    this.klassenServ.grundPlanfaecher$.subscribe((data) =>
      this.grundPlanfaecher = data);
    this.klassenServ.lehrerListe$.subscribe((data) => {
      this.lehrerListe = data
    });


    epochenPlanS.esr_plan$.subscribe((data) => {
      this.esrPlan = data;
    });

    this.klassenServ.terminListe$.subscribe((data) => {
      this.termine = data;
    });
    this.klassenServ.pruefungsListe$.subscribe((data) => {
      this.pruefung = data;
    });
    this.klassenServ.ferienListe$.subscribe((data) => {
      this.ferien = data;
    });

    // this.gewaehlterLehrer = this.lehrerListe[0];


    //   klassenS.grundPlanfaecher$.subscribe(data => this.grundFaecher = data);


  }

  ngOnInit(): void {}

}
