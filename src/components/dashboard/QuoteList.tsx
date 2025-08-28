import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Quote } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  created_at: string;
}

const QuoteList = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchQuotes();
    }
  }, [user]);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", id);

      if (error) throw error;

      setQuotes(quotes.filter((quote) => quote.id !== id));
      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading quotes...</div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card className="bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Quote className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quotes yet
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Start building your quote collection by creating your first quote.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Quotes ({quotes.length})
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quotes.map((quote) => (
          <Card
            key={quote.id}
            className="bg-white hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Quote className="h-5 w-5 text-blue-500 mt-1" />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuote(quote.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="text-gray-800 mb-3 italic">
                &quot;{quote.text}&quot;
              </blockquote>
              {quote.author && (
                <p className="text-sm text-gray-600 mb-2">— {quote.author}</p>
              )}
              {quote.category && (
                <Badge variant="outline" className="text-xs">
                  {quote.category}
                </Badge>
              )}
              <p className="text-xs text-gray-500 mt-3">
                Added {new Date(quote.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuoteList;
