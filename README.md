# SimpleArc

## Installation
`npm i vue-simple-arc`

## Import
```js
import { SimpleArc } from 'vue-simple-arc';
// or: import SimpleArc from 'vue-simple-arc';
```

> `SimpleArcComponent` is still exported as an alias of `SimpleArc` for backward compatibility.

## Usage 
```html
<SimpleArc
    :value="percentage"
    width='350px'
    :fullCircle="false"
    :thickness="8"
    color="#41b883"
    secondColor="#00000033"
>
    <!-- slot -->
</SimpleArc>
```  


## Props  

`width`  
**Type**: String  
**Required**: false  
**Default**: '100%'  
**Description**: 'Width of the component'

`value`  
**Type**: Number  
**Required**: true  
**Description**: Range between 0 and 1, representing the percentage of the arc

`fullCircle`  
**Type**: Boolean  
**Required**: false  
**Default**: false  
**Description**: If the arc should be transformed into a circle instead

`thickness`  
**Type**: Number  
**Required**: false  
**Default**: 8  
**Description**: Thickness of the line 

`color`  
**Type**: String  
**Required**: false  
**Default**: '#41b883' 
**Description**:  Color of the main segment

`secondColor`  
**Type**: String  
**Required**: false  
**Default**: '#00000033'  
**Description**: Color of the background line