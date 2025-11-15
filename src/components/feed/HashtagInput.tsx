import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HashtagInputProps {
  hashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
}

export const HashtagInput = ({ hashtags, onHashtagsChange }: HashtagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      addHashtag();
    }
  };

  const addHashtag = () => {
    const tag = inputValue.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      onHashtagsChange([...hashtags, tag]);
      setInputValue("");
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    onHashtagsChange(hashtags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder="Add hashtags (press Enter or Space)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addHashtag}
      />
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            #{tag}
            <X
              className="h-3 w-3 cursor-pointer"
              onClick={() => removeHashtag(tag)}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
};
