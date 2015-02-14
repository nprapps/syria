#!/bin/bash
cd www/assets/img
for file in *.jpg; do
    if [[ $file != desktop* ]] && [[ $file != mobile* ]] && [[ $file != large* ]];
    then
        echo "Making desktop-$file"
        convert $file -strip -interlace Plane -gaussian-blur 0.03 -quality 80 -resize 1140 desktop-$file
        echo "Making mobile-$file"
        convert $file -strip -interlace Plane -gaussian-blur 0.03 -quality 80 -resize 768 mobile-$file
    fi
done


