# SimpleArcComponent

## Installation
`npm i vue-simple-arc`

## Import
```js
import SimpleArcComponent from 'vue-simple-arc';
```

## Usage 
```html
<SimpleArcComponent
    v-model="percentage"
    width='350px'
    :fullCircle="false"
    :thickness="8"
    color="#41b883"
    secondColor="#00000033"
>
    <!-- slot -->
</SimpleArcComponent>
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

`Fullcircle`  
**Type**: Boolean  
**Required**: false  
**Default**: false  
**Description**: If the arc should be transformed into a circle instead

`thickness`  
**Type**: Number  
**Required**: true  
**Default**: 8  
**Description**: Thickness of the line 

`color`  
**Type**: String  
**Required**: true  
**Default**: '#41b883' 
**Description**:  Color of the main segment

`secondColor`  
**Type**: String  
**Required**: false  
**Default**: '#00000033'  
**Description**: Color of the background line