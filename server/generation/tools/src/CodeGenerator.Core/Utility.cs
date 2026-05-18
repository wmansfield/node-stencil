/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

using System.IO;
using System.Text;
using System.Xml;
using System.Xml.Serialization;

namespace CodeGenerator.Core;

public static class Utility
{
	public static string SerializeToXml<T>(T item)
	{
		if (item == null)
		{
			return string.Empty;
		}
		StringBuilder stringBuilder = new StringBuilder();
		using (StringWriter w = new StringWriter(stringBuilder))
		{
			using XmlTextWriter xmlTextWriter = new XmlTextWriter(w);
			xmlTextWriter.Formatting = Formatting.Indented;
			new XmlSerializer(typeof(T)).Serialize(xmlTextWriter, item);
		}
		return stringBuilder.ToString();
	}

	public static void SerializeToXml<T>(T item, FileInfo outFile) where T : new()
	{
		if (item == null)
		{
			item = new T();
		}
		using TextWriter w = new StreamWriter(outFile.FullName);
		using XmlTextWriter xmlTextWriter = new XmlTextWriter(w);
		xmlTextWriter.Formatting = Formatting.Indented;
		new XmlSerializer(typeof(T)).Serialize(xmlTextWriter, item);
	}

	public static T DeserializeFromXml<T>(string serializedXML) where T : new()
	{
		using StringReader input = new StringReader(serializedXML);
		using XmlReader xmlReader = new XmlTextReader(input);
		return (T)new XmlSerializer(typeof(T)).Deserialize(xmlReader);
	}

	public static T DeserializeFromXml<T>(FileInfo inFile) where T : new()
	{
		using TextReader input = new StreamReader(inFile.FullName);
		using XmlReader xmlReader = new XmlTextReader(input);
		return (T)new XmlSerializer(typeof(T)).Deserialize(xmlReader);
	}

	public static T XmlClone<T>(T item) where T : new()
	{
		if (item == null)
		{
			return item;
		}
		return DeserializeFromXml<T>(SerializeToXml(item));
	}
} 