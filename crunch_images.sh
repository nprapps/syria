#!/bin/bash
cd www/assets/img
for file in *.jpg; do
    echo $file
    convert $file -quality 80 -resize 1600 large-$file
    convert $file -quality 80 -resize 1140 desktop-$file
    convert $file -quality 80 -resize 768 mobile-$file
done


