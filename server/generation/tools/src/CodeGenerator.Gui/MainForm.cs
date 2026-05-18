/*
 * Vibe Coded from legacy code 100% by Cursor and William Mansfield
 */

using System;
using System.ComponentModel;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using CodeGenerator.Core;

namespace CodeGenerator.Gui;

public class MainForm : Form
{
    public const string PREFERENCES_FILE = "code-generator.config.xml";

    private Translator _translator = new Translator();

    private IContainer components = null;

    private Label label1;

    private TextBox txtDataFile;

    private Button btnBrowseData;

    private GroupBox groupBox1;

    private CheckedListBox cblTemplates;

    private Button btnBrowseTemplates;

    private Label label2;

    private TextBox txtOutputFolder;

    private Button btnBrowseOutput;

    private Button btnGenerateFiles;

    private ProgressBar pbGenStatus;

    private Label lblStatus;

    private OpenFileDialog ofdOpenFile;
    private CheckBox chkForWindows;
    private FolderBrowserDialog fbdBrowseFolders;

    public MainForm()
    {
        InitializeComponent();

        // Set form title with version
        string version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0.0";
        this.Text = $"Code Generator v{version}";
    }

    private void btnBrowseData_Click(object sender, EventArgs e)
    {
        try
        {
            ofdOpenFile.Filter = "XML Data File(*.xml)|*.xml";
            ofdOpenFile.Title = "Select XML file to load..";
            ofdOpenFile.Multiselect = false;
            ofdOpenFile.InitialDirectory = txtDataFile.Text;
            if (ofdOpenFile.ShowDialog() == DialogResult.OK)
            {
                _translator.DataFile = ofdOpenFile.FileName;
                txtDataFile.Text = ofdOpenFile.FileName;
            }
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void btnBrowseTemplates_Click(object sender, EventArgs e)
    {
        try
        {
            ofdOpenFile.Filter = "XSL Templates(*.xsl,*.xslt)|*.xsl;*.xslt";
            ofdOpenFile.Title = "Select templates to load..";
            ofdOpenFile.Multiselect = true;
            if (ofdOpenFile.ShowDialog() != DialogResult.OK)
            {
                return;
            }
            _translator.Templates.Clear();
            cblTemplates.Items.Clear();
            string[] fileNames = ofdOpenFile.FileNames;
            Array.Sort(fileNames);
            foreach (string text in fileNames)
            {
                _translator.Templates.Add(new Template(text, text, isSelected: true));
            }
            foreach (Template template in _translator.Templates)
            {
                cblTemplates.Items.Add(template, isChecked: true);
            }
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void btnBrowseOutput_Click(object sender, EventArgs e)
    {
        try
        {
            if (fbdBrowseFolders.ShowDialog() == DialogResult.OK)
            {
                _translator.OutputFolder = fbdBrowseFolders.SelectedPath;
                txtOutputFolder.Text = fbdBrowseFolders.SelectedPath;
            }
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void cblTemplates_ItemCheck(object sender, ItemCheckEventArgs e)
    {
        try
        {
            if (cblTemplates.SelectedItem != null)
            {
                ((Template)cblTemplates.SelectedItem).IsSelected = e.NewValue == CheckState.Checked;
            }
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }
    
    private void btnGenerateFiles_Click(object sender, EventArgs e)
    {
        try
        {
            if (string.IsNullOrEmpty(txtDataFile.Text))
            {
                NotifyError("You must provide a data file.", IsHandled: true);
                return;
            }
            bool flag = false;
            foreach (Template template in _translator.Templates)
            {
                if (template.IsSelected)
                {
                    flag = true;
                    break;
                }
            }
            if (!flag)
            {
                NotifyError("You must have at least one template loaded and selected.", IsHandled: true);
                return;
            }
            _translator.DataFile = txtDataFile.Text;
            _translator.OutputFolder = txtOutputFolder.Text;
            _translator.WindowsLineEndings = chkForWindows.Checked;
            btnGenerateFiles.Enabled = false;
            _translator.GenFiles();
        }
        catch (Exception ex)
        {
            lblStatus.Text = "Error Occurred";
            pbGenStatus.Value = 0;
            NotifyError(ex.Message);
        }
        finally
        {
            btnGenerateFiles.Enabled = true;
            btnGenerateFiles.Focus();
        }
    }

   

    private void _translator_Progress(object sender, TranslatorEventArgs e)
    {
        try
        {
            Invoke((ThreadStart)delegate
            {
                pbGenStatus.Value = Convert.ToInt32(e.Progress);
            });
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void _translator_Notice(object sender, TranslatorEventArgs e)
    {
        try
        {
            Invoke((ThreadStart)delegate
            {
                lblStatus.Text = e.Message;
                Refresh();
            });
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void _translator_Error(object sender, TranslatorEventArgs e)
    {
        try
        {
            Invoke((ThreadStart)delegate
            {
                lblStatus.Text = "Error Occurred";
                pbGenStatus.Value = 0;
                MessageBox.Show(e.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            });
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void NotifyError(string message, bool IsHandled = false)
    {
        if (!IsHandled)
        {
            MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void MainForm_Shown(object sender, EventArgs e)
    {
        try
        {
            _translator.Error += _translator_Error;
            _translator.Notice += _translator_Notice;
            _translator.Progress += _translator_Progress;
            try
            {
                Options options = Utility.DeserializeFromXml<Options>(new FileInfo("code-generator.config.xml"));
                if (options == null)
                {
                    return;
                }
                _translator.DataFile = options.DataFile;
                txtDataFile.Text = options.DataFile;
                _translator.OutputFolder = options.OutputFolder;
                txtOutputFolder.Text = options.OutputFolder;
                chkForWindows.Checked = options.WindowsLineEndings;

                foreach (string selectedFile in options.SelectedFiles)
                {
                    _translator.Templates.Add(new Template(selectedFile, selectedFile, isSelected: true));
                }
                foreach (string unSelectedFile in options.UnSelectedFiles)
                {
                    _translator.Templates.Add(new Template(unSelectedFile, unSelectedFile, isSelected: false));
                }
                _translator.Templates = _translator.Templates.OrderBy(t => t.Name).ToList();
                foreach (Template template in _translator.Templates)
                {
                    cblTemplates.Items.Add(template, template.IsSelected);
                }
            }
            catch
            {
            }
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
    {
        try
        {
            Options options = new Options();
            options.OutputFolder = txtOutputFolder.Text;
            options.DataFile = txtDataFile.Text;
            options.WindowsLineEndings = chkForWindows.Checked;
            foreach (Template template in _translator.Templates)
            {
                if (template.IsSelected)
                {
                    options.SelectedFiles.Add(template.Location);
                }
                else
                {
                    options.UnSelectedFiles.Add(template.Location);
                }
            }
            Utility.SerializeToXml(options, new FileInfo("code-generator.config.xml"));
        }
        catch
        {
        }
    }


    public void LoadXmlFile(string filePath)
    {
        try
        {
            if (File.Exists(filePath))
            {
                _translator.DataFile = filePath;
                txtDataFile.Text = filePath;
            }
        }
        catch (Exception ex)
        {
            NotifyError(ex.Message);
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing && components != null)
        {
            components.Dispose();
        }
        base.Dispose(disposing);
    }

    private void InitializeComponent()
    {
        ComponentResourceManager resources = new ComponentResourceManager(typeof(MainForm));
        label1 = new Label();
        txtDataFile = new TextBox();
        btnBrowseData = new Button();
        groupBox1 = new GroupBox();
        cblTemplates = new CheckedListBox();
        btnBrowseTemplates = new Button();
        label2 = new Label();
        txtOutputFolder = new TextBox();
        btnBrowseOutput = new Button();
        btnGenerateFiles = new Button();
        pbGenStatus = new ProgressBar();
        lblStatus = new Label();
        ofdOpenFile = new OpenFileDialog();
        fbdBrowseFolders = new FolderBrowserDialog();
        chkForWindows = new CheckBox();
        groupBox1.SuspendLayout();
        SuspendLayout();
        // 
        // label1
        // 
        label1.AutoSize = true;
        label1.Location = new Point(34, 28);
        label1.Name = "label1";
        label1.Size = new Size(53, 14);
        label1.TabIndex = 0;
        label1.Text = "Data File";
        // 
        // txtDataFile
        // 
        txtDataFile.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right;
        txtDataFile.Location = new Point(93, 25);
        txtDataFile.Name = "txtDataFile";
        txtDataFile.Size = new Size(506, 22);
        txtDataFile.TabIndex = 0;
        // 
        // btnBrowseData
        // 
        btnBrowseData.Anchor = AnchorStyles.Top | AnchorStyles.Right;
        btnBrowseData.Location = new Point(605, 22);
        btnBrowseData.Name = "btnBrowseData";
        btnBrowseData.Size = new Size(35, 25);
        btnBrowseData.TabIndex = 1;
        btnBrowseData.Text = "...";
        btnBrowseData.UseVisualStyleBackColor = true;
        btnBrowseData.Click += btnBrowseData_Click;
        // 
        // groupBox1
        // 
        groupBox1.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        groupBox1.Controls.Add(cblTemplates);
        groupBox1.Controls.Add(btnBrowseTemplates);
        groupBox1.Location = new Point(15, 65);
        groupBox1.Name = "groupBox1";
        groupBox1.Size = new Size(632, 270);
        groupBox1.TabIndex = 3;
        groupBox1.TabStop = false;
        groupBox1.Text = "Translator Templates";
        // 
        // cblTemplates
        // 
        cblTemplates.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        cblTemplates.BorderStyle = BorderStyle.FixedSingle;
        cblTemplates.FormattingEnabled = true;
        cblTemplates.Location = new Point(6, 48);
        cblTemplates.Name = "cblTemplates";
        cblTemplates.Size = new Size(620, 206);
        cblTemplates.TabIndex = 1;
        cblTemplates.ItemCheck += cblTemplates_ItemCheck;
        // 
        // btnBrowseTemplates
        // 
        btnBrowseTemplates.Anchor = AnchorStyles.Top | AnchorStyles.Right;
        btnBrowseTemplates.Location = new Point(495, 16);
        btnBrowseTemplates.Name = "btnBrowseTemplates";
        btnBrowseTemplates.Size = new Size(130, 25);
        btnBrowseTemplates.TabIndex = 0;
        btnBrowseTemplates.Text = "Load Templates..";
        btnBrowseTemplates.UseVisualStyleBackColor = true;
        btnBrowseTemplates.Click += btnBrowseTemplates_Click;
        // 
        // label2
        // 
        label2.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
        label2.AutoSize = true;
        label2.Location = new Point(12, 358);
        label2.Name = "label2";
        label2.Size = new Size(84, 14);
        label2.TabIndex = 4;
        label2.Text = "Output Folder";
        // 
        // txtOutputFolder
        // 
        txtOutputFolder.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        txtOutputFolder.Location = new Point(100, 355);
        txtOutputFolder.Name = "txtOutputFolder";
        txtOutputFolder.Size = new Size(506, 22);
        txtOutputFolder.TabIndex = 2;
        // 
        // btnBrowseOutput
        // 
        btnBrowseOutput.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
        btnBrowseOutput.Location = new Point(612, 353);
        btnBrowseOutput.Name = "btnBrowseOutput";
        btnBrowseOutput.Size = new Size(35, 25);
        btnBrowseOutput.TabIndex = 3;
        btnBrowseOutput.Text = "...";
        btnBrowseOutput.UseVisualStyleBackColor = true;
        btnBrowseOutput.Click += btnBrowseOutput_Click;
        // 
        // btnGenerateFiles
        // 
        btnGenerateFiles.Anchor = AnchorStyles.Bottom;
        btnGenerateFiles.Location = new Point(261, 425);
        btnGenerateFiles.Name = "btnGenerateFiles";
        btnGenerateFiles.Size = new Size(133, 43);
        btnGenerateFiles.TabIndex = 4;
        btnGenerateFiles.Text = "Generate Files";
        btnGenerateFiles.UseVisualStyleBackColor = true;
        btnGenerateFiles.Click += btnGenerateFiles_Click;
        // 
        // pbGenStatus
        // 
        pbGenStatus.Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        pbGenStatus.Location = new Point(12, 394);
        pbGenStatus.Name = "pbGenStatus";
        pbGenStatus.Size = new Size(635, 25);
        pbGenStatus.TabIndex = 8;
        // 
        // lblStatus
        // 
        lblStatus.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
        lblStatus.Font = new Font("Tahoma", 9F, FontStyle.Bold, GraphicsUnit.Point, 0);
        lblStatus.Location = new Point(433, 439);
        lblStatus.Name = "lblStatus";
        lblStatus.Size = new Size(207, 25);
        lblStatus.TabIndex = 9;
        lblStatus.TextAlign = ContentAlignment.MiddleRight;
        // 
        // chkForWindows
        // 
        chkForWindows.Anchor = AnchorStyles.Bottom | AnchorStyles.Left;
        chkForWindows.AutoSize = true;
        chkForWindows.Location = new Point(17, 440);
        chkForWindows.Name = "chkForWindows";
        chkForWindows.Size = new Size(97, 18);
        chkForWindows.TabIndex = 10;
        chkForWindows.Text = "For Windows";
        chkForWindows.UseVisualStyleBackColor = true;
        // 
        // MainForm
        // 
        AutoScaleDimensions = new SizeF(7F, 14F);
        AutoScaleMode = AutoScaleMode.Font;
        ClientSize = new Size(659, 480);
        Controls.Add(chkForWindows);
        Controls.Add(lblStatus);
        Controls.Add(pbGenStatus);
        Controls.Add(btnGenerateFiles);
        Controls.Add(btnBrowseOutput);
        Controls.Add(txtOutputFolder);
        Controls.Add(label2);
        Controls.Add(groupBox1);
        Controls.Add(btnBrowseData);
        Controls.Add(txtDataFile);
        Controls.Add(label1);
        Font = new Font("Tahoma", 9F, FontStyle.Regular, GraphicsUnit.Point, 0);
        Icon = (Icon)resources.GetObject("$this.Icon");
        MaximizeBox = false;
        Name = "MainForm";
        StartPosition = FormStartPosition.CenterScreen;
        Text = "Code Generation Utility";
        FormClosing += MainForm_FormClosing;
        Shown += MainForm_Shown;
        groupBox1.ResumeLayout(false);
        ResumeLayout(false);
        PerformLayout();
    }
} 