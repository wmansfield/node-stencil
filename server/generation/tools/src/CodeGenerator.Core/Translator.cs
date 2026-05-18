/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

namespace CodeGenerator.Core;

using System.Net;
using System.Text.RegularExpressions;
using System.IO;
using System.Xml.Xsl;
using System.Xml.XPath;
using System.Text;
using System.Xml;

public class Translator
{
	public string DataFile { get; set; }

	public List<Template> Templates { get; set; }

	public bool WindowsLineEndings { get; set; }


    public string OutputFolder { get; set; }

	public event EventHandler<TranslatorEventArgs> Error;

	public event EventHandler<TranslatorEventArgs> Notice;

	public event EventHandler<TranslatorEventArgs> Progress;

	public Translator()
	{
		Templates = new List<Template>();
	}

	protected virtual void OnError(string errorMessage)
	{
		if (this.Error != null)
		{
			this.Error(this, new TranslatorEventArgs(errorMessage));
		}
	}

	protected virtual void OnNotice(string processMessage)
	{
		if (this.Notice != null)
		{
			this.Notice(this, new TranslatorEventArgs(processMessage));
		}
	}

	protected virtual void OnProgessNotification(decimal percentageComplete)
	{
		if (this.Progress != null)
		{
			this.Progress(this, new TranslatorEventArgs(percentageComplete));
		}
	}

	public void GenFiles()
	{
		OnNotice("Parsing Templates");
		string transformedDoc = Transform();
		OnNotice("Writing Files");
		ParseDocument(transformedDoc);
		OnNotice("Complete");
	}

	protected void ParseDocument(string transformedDoc)
	{
		try
		{
			int num = 0;
			int totalFiles = 0;
			
			// Count total files for progress calculation
			Regex startFileRegex = new Regex("'''\\[STARTFILE:(?<Remove>REMOVE:|)(?<FileName>.*?)\\](?<Data>.*?)'''\\[ENDFILE\\]", RegexOptions.Singleline);
			Regex ensureFileRegex = new Regex("'''\\[ENSUREFILE:(?<Remove>REMOVE:|)(?<FileName>.*?)\\](?<Data>.*?)'''\\[ENDFILE\\]", RegexOptions.Singleline);
			
			MatchCollection startFileMatches = startFileRegex.Matches(transformedDoc);
			MatchCollection ensureFileMatches = ensureFileRegex.Matches(transformedDoc);
			totalFiles = startFileMatches.Count + ensureFileMatches.Count;
			
			OnProgessNotification(num);
			
			// Process STARTFILE tokens (always overwrite)
			foreach (Match item in startFileMatches)
			{
				ProcessFileToken(item, true, num, totalFiles);
				num++;
				OnProgessNotification(decimal.Multiply(decimal.Divide(num, new decimal(totalFiles)), 100m));
			}
			
			// Process ENSUREFILE tokens (only create if doesn't exist)
			foreach (Match item in ensureFileMatches)
			{
				ProcessFileToken(item, false, num, totalFiles);
				num++;
				OnProgessNotification(decimal.Multiply(decimal.Divide(num, new decimal(totalFiles)), 100m));
			}
			
			OnProgessNotification(0m);
		}
		catch (Exception ex2)
		{
			OnError("Error Loading Document\r\nError: " + ex2.Message);
		}
	}
	
	private void ProcessFileToken(Match item, bool overwrite, int currentFile, int totalFiles)
	{
		string fileName = item.Groups["FileName"].ToString();
		string data = item.Groups["Data"].ToString();

		// Normalize path separators: replace Windows backslashes with forward slashes
		// This ensures XSL templates with hardcoded backslashes work on Linux/macOS
		fileName = fileName.Replace('\\', Path.DirectorySeparatorChar);

		string fullPath = Path.Combine(OutputFolder, fileName);
		bool removeExact = item.Groups["Remove"].ToString() == "REMOVE:";

		// Normalize the path to handle any path separator issues
		fullPath = Path.GetFullPath(fullPath);
		
		try
		{
			
			
			// Create directory if it doesn't exist
			string directoryName = Path.GetDirectoryName(fullPath);
			if (!string.IsNullOrEmpty(directoryName) && !Directory.Exists(directoryName))
			{
				Directory.CreateDirectory(directoryName);
			}
			
			// Trim whitespace from content and decode HTML entities
			string trimmedContent = WebUtility.HtmlDecode(data).Trim();

			if (removeExact)
			{
				if (File.Exists(fullPath))
				{
					string foundContent = File.ReadAllText(fullPath);
					if (foundContent == trimmedContent)
					{
                        File.Delete(fullPath);
                        OnNotice($"Removed file: {fileName} from {fullPath}");
                    }
				}
				return;
			}
			else
			{
                // Check if file already exists
                if (!overwrite && File.Exists(fullPath))
                {
                    OnNotice($"Skipping existing file: {fileName}");
					return;
                }

                OnNotice($"Writing file: {fileName} to {fullPath} (Content length: {trimmedContent.Length} chars)");
				// Write the file
				using (StreamWriter streamWriter = new StreamWriter(fullPath))
				{
					streamWriter.Write(trimmedContent);
				}

				// Verify the file was actually written
				if (File.Exists(fullPath))
				{
					FileInfo writtenFile = new FileInfo(fullPath);
					string action = overwrite ? "Created/Updated" : "Created";
					OnNotice($"{action} file: {fileName} (Size: {writtenFile.Length} bytes)");
				}
				else
				{
					OnError($"Failed to write file: {fileName} to {fullPath}");
				}
			}
		}
		catch (Exception ex)
		{
			OnError($"Error processing file {fileName}: {ex.Message}\rProcessing will continue to the next file.");
		}
	}

	protected string Transform()
	{
		try
		{
			StringBuilder stringBuilder = new StringBuilder();
			using StringWriter w = new StringWriter(stringBuilder);
			
			// Create XmlWriterSettings with permissive conformance for non-standard XML
			XmlWriterSettings xmlWriterSettings = new XmlWriterSettings
			{
				ConformanceLevel = ConformanceLevel.Fragment,
				OmitXmlDeclaration = true,
				Indent = false
			};
			
			using XmlWriter output = XmlWriter.Create(w, xmlWriterSettings);
			{
				XmlResolver resolver = new XmlUrlResolver();
				
				// Create XmlReaderSettings with permissive settings for the input document
				XmlReaderSettings xmlReaderSettings = new XmlReaderSettings
				{
					ConformanceLevel = ConformanceLevel.Fragment,
					DtdProcessing = DtdProcessing.Ignore,
					ValidationType = ValidationType.None,
					IgnoreWhitespace = true,
					IgnoreComments = true
				};
				
				using XmlReader xmlReader = XmlReader.Create(DataFile, xmlReaderSettings);
				XPathDocument input = new XPathDocument(xmlReader);
				
				List<Template> list = new List<Template>();
				foreach (Template template in Templates)
				{
					if (template.IsSelected)
					{
						list.Add(template);
					}
				}
				int num = 0;
				OnProgessNotification(num);
				foreach (Template item in list)
				{
					try
					{
						// Create a new XslCompiledTransform for each template (like the original code)
						XslCompiledTransform xslTransform = new XslCompiledTransform();
						xslTransform.Load(item.Location);
						
						xslTransform.Transform(input, null, output, resolver);
					}
					catch (Exception ex)
					{
						OnError("Error Transforming Template " + item.Location + ".\rProcessing will continue.\r\nError: " + ex.Message);
					}
					num++;
					OnProgessNotification(decimal.Multiply(decimal.Divide(num, new decimal(list.Count)), 100m));
				}
			}
			string result = stringBuilder.ToString();
			if (this.WindowsLineEndings)
			{
				// only \r\n
                result = result.Replace("\r\n", "\n").Replace("\r", "\n").Replace("\n", "\r\n");
            }
			else
			{
				// only \n
                result = result.Replace("\r\n", "\n").Replace("\r", "\n");
            }
			return result;
		}
		catch (Exception ex2)
		{
			OnError("Error Transforming Templates.\r\nProcessing will stop.\r\nError: " + ex2.Message);
			return string.Empty;
		}
	}
} 