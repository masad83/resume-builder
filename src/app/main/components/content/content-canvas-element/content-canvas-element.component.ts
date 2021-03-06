import { ViewEncapsulation,Component, OnInit,AfterViewInit,Input,HostListener,ChangeDetectionStrategy,HostBinding,ElementRef,Renderer2,ChangeDetectorRef} from '@angular/core';
import {ContentService} from '../../../../common/services/content.service';
import {DataManagerService} from '../../../../common/services/data-manager.service';

@Component({
  selector: '[contentCanvasElement]',
  templateUrl: './content-canvas-element.component.html',
  styleUrls: ['./content-canvas-element.component.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush,
  encapsulation:ViewEncapsulation.None
})
export class ContentCanvasElementComponent implements OnInit,AfterViewInit{
@Input() element:any = null;
@Input() currentRatio:number = 1;
@Input() inner:boolean = false;
@Input() list:boolean = false;
blurListener:any;
  constructor(private el:ElementRef,
  	private contentService:ContentService,
  	private renderer2:Renderer2,
  	private cdr:ChangeDetectorRef,
  	private dataManager:DataManagerService) { 
  this.el.nativeElement.canDrag = true;
}

@HostBinding('style.position') 
get positionType(){
let pos = (this.inner && !this.element.grouped) ? 'relative':'absolute';
return pos;	
}

@HostBinding('style.display') 
get displayType(){
return this.element.list ? '' : 'inline-block';	
}

get selected(){
		this.renderer2.setAttribute(this.el.nativeElement,'selected',this._selected ? 'true' : 'false');
		return this._selected;
}

set selected(val){
	this.renderer2.setAttribute(this.el.nativeElement,'selected',val ? 'true' : 'false');
	this._selected = val;
}

_selected:boolean = false;
_hovered:boolean = false;
@HostListener('mouseenter')
onHover(){
	if(!this._hovered && !this.selected && this.element.element != 'li'){
		this._hovered = true;
		this.el.nativeElement.className += ' hovered';
	}
}

@HostListener('mouseleave')
onUnhover(){
	if(this._hovered && !this.selected && this.element.element != 'li'){
		this._hovered = false;
		this.el.nativeElement.className = this.el.nativeElement.className.replace(' hovered','');
	}
}
@HostListener('dblclick',['$event'])
onDoubleClick(evt){
	let selected = this.el.nativeElement.getAttribute('selected');
	if(selected == 'false' && ((this.list && !this.inner) || !this.list)){
	this.deactivateDirectives();
	this.removeCustomClass('selected');
		this.selected = true;
		
		this.contentService.pushIntoSelection(this.el.nativeElement,false);
		this.assignDimensions();
		this.el.nativeElement.className = this.el.nativeElement.className.replace(' hovered','');
		this.el.nativeElement.classList.add('selected');

		this.el.nativeElement.className = this.el.nativeElement.className.replace('cursor-draggable','');
		this.el.nativeElement.isEditing = true;
		this.el.nativeElement.canDrag = false;
		if(this.el.nativeElement['ResizeableDir']){
			this.el.nativeElement['ResizeableDir'].editMode();
		}
		
		this.renderer2.setAttribute(this.el.nativeElement,'contenteditable','true');
		this.el.nativeElement.focus();
		
		var caretRange = this.getMouseEventCaretRange(evt);
	    var self = this;
	    
	    setTimeout(function() {
	        self.selectRange(caretRange);
	        evt.stopPropagation();
	    }, 10);		
	    let contentElement = document.querySelector('app-content');
	    this.blurListener = this.renderer2.listen(contentElement,'custom-blur',this.blurElement.bind(this));
	}
}

ngOnInit(){
	if(this.element){
		this.el.nativeElement.style.left = this.inner ? '' :  this.element.attrs.x+'px';
		this.el.nativeElement.style.top = this.inner ? '' :  this.element.attrs.y+'px';
		let translatable = this.inner ? 'false' : 'true';
		this.renderer2.setAttribute(this.el.nativeElement,'translatable',translatable);
		if(this.element.element == 'li'){
			this.renderer2.setAttribute(this.el.nativeElement,'list-element','true');
		}
		if(this.element.groupedElements && this.element.groupedElements.length > 0) this.renderer2.setAttribute(this.el.nativeElement,'grouped','true');
		this.createElement(this.el.nativeElement,this.element);
	}
	this.contentService.selectedElement.subscribe((element)=>{
		if(element && element.id.includes('inner') && this.inner){
			this.selected=false;
		}
	})
}

ngAfterViewInit(){

	this.cdr.detach();
}


updatePosition(id){
	this.element.attrs['y']= this.el.nativeElement.style.top.replace('px','');
	this.element.attrs['x']=this.el.nativeElement.style.left.replace('px','');
}


blurElement(event){
	this.removeCustomClass('selected');
	if(this.inner){
			this.el.nativeElement.style.width = '';
			this.el.nativeElement.style.height = '';
		}
if(this.selected){
		this.selected = false;
		this.el.nativeElement.isEditing = false;
		this.el.nativeElement.canDrag = true;
		if(this.el.nativeElement['ResizeableDir']){
			this.el.nativeElement['ResizeableDir'].editMode();
		}
		
		this.el.nativeElement.className += ' cursor-draggable';
		this.el.nativeElement.className = this.el.nativeElement.className.replace('selected','');
		this.renderer2.setAttribute(this.el.nativeElement,'contenteditable','false');
		this.contentService.removeFromSelection(false);
	}
	this.blurListener();
	this.cdr.markForCheck();
}

assignDimensions(){
		let dims:ClientRect = this.el.nativeElement.getBoundingClientRect();
		let parentDims:ClientRect = this.el.nativeElement.parentElement.getBoundingClientRect();
		let width,height;
		width = dims.width;
		height = dims.height;
		if(dims.width>parentDims.width){
			width = parentDims.width;
		}

		if(dims.height>parentDims.height){
			height = parentDims.height;
		}
		this.el.nativeElement.style.width = width+'px';
		this.el.nativeElement.style.height = height+'px';
}

  createElement(parent,newElement){
  	let el = document.createElement(newElement.element);
  	if((newElement.element=='ul' || newElement.element == 'ol') && !this.list){
  		this.list = true;		
  	}
 
 if(this.list){el = this.el.nativeElement;}
if(newElement.content){

	  let text = this.renderer2.createText(newElement.content);
	  if((!newElement.innerAssets || newElement.innerAssets.length<1) && !this.inner){
	  	this.renderer2.addClass(el,'single-parent-content');
	  }
  this.renderer2.appendChild(el,text);

}

  for(var key in newElement.mainStyles){
  	this.renderer2.setStyle(this.el.nativeElement,key,newElement.mainStyles[key]);
  }
	if(!this.list){
		this.renderer2.appendChild(parent,el);
	}
 }
  

getMouseEventCaretRange(evt) {
    var range, x = evt.clientX, y = evt.clientY;
    const doc = document as any;
    if (doc.body.createTextRange) {
        range = doc.body.createTextRange();
        range.moveToPoint(x, y);
    }

    else if (typeof doc.createRange != "undefined") {
        if (typeof evt.rangeParent != "undefined") {
            range = doc.createRange();
            range.setStart(evt.rangeParent, evt.rangeOffset);
            range.collapse(true);
        }
        else if (doc.caretPositionFromPoint) {
            var pos = doc.caretPositionFromPoint(x, y);
            range = doc.createRange();
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
        }
        else if (doc.caretRangeFromPoint) {
            range = doc.caretRangeFromPoint(x, y);
        }
    }
    return range;
}

selectRange(range) {
    if (range) {
        if (typeof range.select != "undefined") {
            range.select();
        } else if (typeof window.getSelection != "undefined") {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

removeCustomClass(className:string){
	if(!className || className == '') return;
	let selectedEls = document.querySelectorAll('.'+className);
	[].forEach.call(selectedEls,(el)=>{
		//if(el && el.id.includes('inner')){
			el.classList.remove(className);
		//}
	})
}

deactivateDirectives(){
	let elements = document.querySelectorAll('.selected');
	[].forEach.call(elements,(el)=>{
		if(el['ResizeableDir']){
			el.isEditing = false;
			el.canDrag= true;
			el.setAttribute('selected',false);
			el.classList.add('cursor-draggable');
			el['ResizeableDir'].editMode();
		}
	})
}


}
