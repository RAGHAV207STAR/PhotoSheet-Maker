"use client";

import { useEditor } from '@/context/editor-context';
import EditablePhoto from '../editable-photo';


export default function FreeformLayout() {
    const {
        collagePhotos,
    } = useEditor();
    
    return (
        <div className="w-full h-full relative">
            {collagePhotos.map(photo => (
                <EditablePhoto key={photo.id} photo={photo} isFreeform={true} />
            ))}
        </div>
    );
}

    