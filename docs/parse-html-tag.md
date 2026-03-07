```html
<html>
    <h1 class="heading"> Hello </h1>
    <img src="image.jpg">
    <h2 class="heading2">Hello </h2>
    <select>
        <main>
            <h1>hi</h1>
        </main>
    </select>
</html>
```

Info: Here I have a html file or text, that will be my input. I will do some steps to make a tree like structure from this html.

Just a normal html page or file.
1. remove all new line with a space.
2. remove extra space after '<' this tag. and remove extra space before '>' this tag. and add one space
```
<html> <h1 class="heading"> Hello </h1> <img src="image.jpg"> <h2 class="heading2">Hello </h2> <select> <main> <h1>hi</h1> </main> </select> </html>
```
3. now only parse with space. now I have three component
    1. starting tag
    2. ending tag
    3. plain text
```
<html>
<h1 class="heading">
hello
</h1>
<img src="image.jpg">
```
4. Now I can start making tree on this. tree node have three component.
    1. node number(auto incremented with html tag)
    2. tag
    3. {key,value}=map
    4. info/plain text.
```json
<h1 class="heading"> Hello </h1>
tag = h1
map = {"class":"heading"}
info = Hello
```
5. Need to maintail a stack while creating node. If I pop any node from stack. just track the last stored stack node. that will be parent and current poped up node will be child node.

