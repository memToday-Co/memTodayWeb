import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

const QuoteForm = () => {
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a quote",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("quotes").insert({
        text: text.trim(),
        author: author.trim() || null,
        category: category.trim() || null,
        user_id: user?.id,
      });

      if (error) throw error;

      // Clear form
      setText("");
      setAuthor("");
      setCategory("");

      toast({
        title: "Success",
        description: "Quote created successfully!",
      });
    } catch (error) {
      console.error("Error creating quote:", error);
      toast({
        title: "Error",
        description: "Failed to create quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Create New Quote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="text">Quote Text *</Label>
            <Textarea
              id="text"
              placeholder="Enter the quote you want to memorize..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              placeholder="Who said this quote? (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Motivation, Philosophy, Literature (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !text.trim()}
          >
            {loading ? "Creating..." : "Create Quote"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuoteForm;
